import copy
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from io import BytesIO
from urllib.error import HTTPError, URLError

from fastapi import HTTPException, Response
from app import database
from app.routers.auth import register
from app.routers.consultations import create_consultation, latest_patient_consultation, retry_consultation_summary
from app.routers.admin import consultation_queue
from app.schemas.consultation import ConsultationCreate
from app.schemas.user import RegisterRequest, UserResponse
from app.services import ai_service, ollama_summary

DATA = dict(symptoms=['Headache'], duration='Today', impact='Some activities are difficult', history='Penicillin allergy', medicines='None reported', notes='')
OUTPUT = dict(
    narrative=[dict(text='The patient reports a headache starting today, making some activities difficult. They report a penicillin allergy and no current medicines.', evidence=[dict(field='symptoms', quote='Headache'), dict(field='duration', quote='Today'), dict(field='impact', quote='Some activities are difficult'), dict(field='history', quote='Penicillin allergy'), dict(field='medicines', quote='None reported')])],
    clinician_notes=[dict(text='The reported penicillin allergy should be reviewed by the clinician.', evidence=[dict(field='history', quote='Penicillin allergy')])],
    possible_conditions=[dict(name='Tension-type headache', reason='The reported headache could be consistent with this, but the description alone cannot establish a cause.', evidence=[dict(field='symptoms', quote='Headache')])],
)


class ModelTests(unittest.TestCase):
    def test_verified_output_has_possible_conditions_and_fixed_disclaimer(self):
        with patch.object(ollama_summary, '_chat', side_effect=[ollama_summary.ModelSummary(**OUTPUT), ollama_summary.SafetyCheck(approved=True, problems=[])]):
            text = ollama_summary.generate_ollama_summary(ConsultationCreate(**DATA))
        self.assertIn('may be one possibility', text)
        self.assertIn('not diagnoses', text)
        self.assertTrue(text.endswith(ollama_summary.DISCLAIMER))

    def test_invented_evidence_is_rejected(self):
        output = copy.deepcopy(OUTPUT)
        output['narrative'][0]['evidence'][0]['quote'] = 'Fever'
        with patch.object(ollama_summary, '_chat', return_value=ollama_summary.ModelSummary(**output)) as chat:
            with self.assertRaises(ValueError):
                ollama_summary.generate_ollama_summary(ConsultationCreate(**DATA))
            chat.assert_called_once()

    def test_failed_safety_review_is_rejected(self):
        with patch.object(ollama_summary, '_chat', side_effect=[ollama_summary.ModelSummary(**OUTPUT), ollama_summary.SafetyCheck(approved=False, problems=['Unsupported diagnostic claim'])]):
            with self.assertRaises(ValueError):
                ollama_summary.generate_ollama_summary(ConsultationCreate(**DATA))

    def test_local_request_contains_only_responses_and_validated_schema(self):
        response = {'done': True, 'message': {'content': json.dumps(OUTPUT)}}
        with patch.dict(os.environ, {'OLLAMA_BASE_URL': 'http://127.0.0.1:11434', 'OLLAMA_MODEL': 'test-model'}), patch.object(ollama_summary, 'urlopen', return_value=BytesIO(json.dumps(response).encode())) as request:
            ollama_summary._chat(ollama_summary.SYSTEM_PROMPT, DATA, ollama_summary.ModelSummary)
            sent = json.loads(request.call_args.args[0].data)
            self.assertFalse(sent['stream'])
            self.assertEqual(sent['model'], 'test-model')
            self.assertIn('properties', sent['format'])
            self.assertEqual(json.loads(sent['messages'][1]['content'])['data'], DATA)

    def test_remote_server_and_truncated_output_are_rejected(self):
        with patch.dict(os.environ, {'OLLAMA_BASE_URL': 'https://external.example'}), patch.object(ollama_summary, 'urlopen') as request:
            with self.assertRaises(ValueError):
                ollama_summary._chat('', DATA, ollama_summary.ModelSummary)
            request.assert_not_called()
        response = {'done': True, 'done_reason': 'length', 'message': {'content': '{}'}}
        with patch.dict(os.environ, {'OLLAMA_BASE_URL': 'http://localhost:11434'}), patch.object(ollama_summary, 'urlopen', return_value=BytesIO(json.dumps(response).encode())):
            with self.assertRaises(ValueError):
                ollama_summary._chat('', DATA, ollama_summary.ModelSummary)


class StoredSummaryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        env = patch.dict(os.environ, {}, clear=True)
        env.start()
        self.addCleanup(env.stop)
        path = patch.object(database, 'DATABASE_PATH', Path(self.temp.name) / 'test.db')
        path.start()
        self.addCleanup(path.stop)
        self.connections = []
        connect = sqlite3.connect
        def tracked(*args, **kwargs):
            connection = connect(*args, **kwargs)
            self.connections.append(connection)
            return connection
        patched = patch.object(database.sqlite3, 'connect', tracked)
        patched.start()
        self.addCleanup(patched.stop)
        self.addCleanup(lambda: [connection.close() for connection in self.connections])
        database.initialize_database()
        self.user = register(RegisterRequest(name='Example', email='example@test.com', password='test-password'), Response()).user
        self.payload = ConsultationCreate(**DATA)

    def test_patient_and_admin_read_exact_saved_text_without_regeneration(self):
        text = 'One immutable generated summary. ' + ollama_summary.DISCLAIMER
        with patch.object(ai_service, 'generate_ollama_summary', return_value=text) as generate:
            submitted = create_consultation(self.payload, self.user)
            patient = latest_patient_consultation(self.user)
            admin = consultation_queue(UserResponse(id='admin', name='Admin', email='admin@test.com', role='admin'))[0]
            retry = retry_consultation_summary(submitted.id, self.user)
        generate.assert_called_once()
        self.assertEqual(submitted.summary, patient['summary'])
        self.assertEqual(patient['summary'], admin['summary'])
        self.assertEqual(retry.summary, text)
        self.assertEqual(patient['summary_source'], 'ollama')
        for field in DATA:
            self.assertEqual(patient[field], DATA[field])
            self.assertEqual(admin[field], DATA[field])

    def test_unavailable_model_saves_basic_summary_and_can_retry(self):
        with patch.object(ai_service, 'generate_ollama_summary', side_effect=TimeoutError):
            saved = create_consultation(self.payload, self.user)
        self.assertEqual(saved.summary_source, 'basic')
        self.assertIn('Penicillin allergy', saved.summary)
        self.assertNotIn('Tension-type headache', saved.summary)
        with patch.object(ai_service, 'generate_ollama_summary', return_value='Reviewed summary'):
            result = retry_consultation_summary(saved.id, self.user)
        self.assertEqual(result.summary_source, 'ollama')
        self.assertEqual(latest_patient_consultation(self.user)['summary'], 'Reviewed summary')

    def test_other_patient_cannot_request_summary(self):
        with patch.object(ai_service, 'generate_ollama_summary', side_effect=TimeoutError):
            saved = create_consultation(self.payload, self.user)
        with patch.object(ai_service, 'generate_ollama_summary') as generate:
            with self.assertRaises(HTTPException) as error:
                retry_consultation_summary(saved.id, UserResponse(id='other', name='Other', email='other@test.com'))
            self.assertEqual(error.exception.status_code, 404)
            generate.assert_not_called()

    def test_errors_explain_connection_model_timeout_and_validation_failures(self):
        cases = [
            (URLError('connection refused'), 'not running'),
            (HTTPError('http://localhost', 404, 'missing', {}, None), 'not installed'),
            (TimeoutError(), 'too long'),
            (ValueError('unsafe output'), 'did not pass'),
        ]
        for failure, expected in cases:
            with self.subTest(expected=expected), patch.object(ai_service, 'generate_ollama_summary', side_effect=failure):
                result = create_consultation(self.payload, self.user)
                self.assertEqual(result.summary_source, 'basic')
                self.assertIn(expected, result.summary_error)

    def test_database_restart_never_calls_ai_or_changes_existing_summary(self):
        with patch.object(ai_service, 'generate_ollama_summary', return_value='Saved AI text') as generate:
            create_consultation(self.payload, self.user)
            database.initialize_database()
            self.assertEqual(latest_patient_consultation(self.user)['summary'], 'Saved AI text')
            generate.assert_called_once()


if __name__ == '__main__':
    unittest.main()
