import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from fastapi import HTTPException, Response
from pydantic import ValidationError
from app import database
from app.routers.auth import register
from app.routers.appointments import select_appointment_offer
from app.schemas.appointment import AppointmentSelection
from app.schemas.user import RegisterRequest, UserResponse
from app.services import notification_service as notifications


class NotificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        env = patch.dict(os.environ, {}, clear=True)
        env.start()
        self.addCleanup(env.stop)
        path = patch.object(database, 'DATABASE_PATH', Path(self.temp.name) / 'test.db')
        path.start()
        self.addCleanup(path.stop)
        # Close SQLite handles explicitly for Windows file cleanup.
        self.connections = []
        connect = sqlite3.connect
        def tracked_connect(*args, **kwargs):
            kwargs['check_same_thread'] = False
            connection = connect(*args, **kwargs)
            self.connections.append(connection)
            return connection
        patched_connect = patch.object(database.sqlite3, 'connect', tracked_connect)
        patched_connect.start()
        self.addCleanup(patched_connect.stop)
        self.addCleanup(lambda: [connection.close() for connection in self.connections])
        database.initialize_database()
        self.user = register(RegisterRequest(name='Example Patient', email='patient@example.com', password='test-password', mobile='0821234567'), Response()).user
        with database.get_connection() as connection:
            connection.execute("INSERT INTO consultations (id, patient_id, symptoms, duration, impact) VALUES ('consultation', ?, '[]', 'Today', 'Mild')", (self.user.id,))
            connection.execute("INSERT INTO appointment_offers (id, consultation_id, starts_at, department, location) VALUES ('offer', 'consultation', '2030-01-10T08:00:00Z', 'General', 'Main reception')")

    def book(self):
        return select_appointment_offer('offer', AppointmentSelection(mobile='0821234567'), self.user)

    def test_registration_saves_normalized_phone_and_invalid_phone_is_rejected(self):
        self.assertEqual(self.user.mobile, '+27821234567')
        with self.assertRaises(ValidationError):
            AppointmentSelection(mobile='invalid')

    def test_both_channels_use_saved_contacts_and_duplicate_booking_does_not_resend(self):
        with patch.object(notifications, 'send_sms', return_value=('accepted', 'sms-id')) as sms, patch.object(notifications, 'send_email', return_value=('accepted', '')) as email:
            appointment = self.book()
            duplicate = self.book()
        self.assertEqual(appointment.id, duplicate.id)
        self.assertEqual(appointment.notifications, {'sms': 'accepted', 'email': 'accepted'})
        sms.assert_called_once()
        email.assert_called_once()
        self.assertEqual(sms.call_args.args[0], '+27821234567')
        self.assertEqual(email.call_args.args[0], 'patient@example.com')
        self.assertIn('10 Jan 2030 at 10:00 SAST', sms.call_args.args[1])
        self.assertIn('Main reception', sms.call_args.args[1])
        self.assertNotIn('symptoms', sms.call_args.args[1])

    def test_sms_timeout_keeps_booking_and_still_sends_email(self):
        with patch.object(notifications, 'send_sms', side_effect=TimeoutError), patch.object(notifications, 'send_email', return_value=('accepted', '')):
            appointment = self.book()
        self.assertEqual(appointment.status, 'confirmed')
        self.assertEqual(appointment.notifications, {'sms': 'unknown', 'email': 'accepted'})

    def test_missing_provider_settings_do_not_claim_messages_were_sent(self):
        appointment = self.book()
        self.assertEqual(appointment.notifications, {'sms': 'not_configured', 'email': 'not_configured'})
        self.assertEqual(appointment.status, 'confirmed')

    def test_other_patient_cannot_book_or_send_notifications(self):
        other = UserResponse(id='another-patient', name='Other', email='other@example.com')
        with patch.object(notifications, 'send_sms') as sms:
            with self.assertRaises(HTTPException) as error:
                select_appointment_offer('offer', AppointmentSelection(mobile='0821234567'), other)
            self.assertEqual(error.exception.status_code, 404)
            sms.assert_not_called()

    def test_provider_requests_are_correct_without_sending_live_messages(self):
        from io import BytesIO
        with patch.dict(os.environ, {'TWILIO_ACCOUNT_SID': 'ACtest', 'TWILIO_AUTH_TOKEN': 'test-token', 'TWILIO_FROM_NUMBER': '+15005550006'}), patch.object(notifications, 'urlopen', return_value=BytesIO(b'{"sid":"SMtest","status":"queued"}')) as request:
            self.assertEqual(notifications.send_sms('+27821234567', 'Test confirmation'), ('accepted', 'SMtest'))
            self.assertIn(b'To=%2B27821234567', request.call_args.args[0].data)
        with patch.dict(os.environ, {'SMTP_HOST': 'smtp.example.com', 'SMTP_FROM': 'appointments@example.com', 'SMTP_USERNAME': 'test', 'SMTP_PASSWORD': 'secret'}), patch.object(notifications.smtplib, 'SMTP') as smtp:
            smtp.return_value.__enter__.return_value.send_message.return_value = {}
            self.assertEqual(notifications.send_email('patient@example.com', 'Test confirmation'), ('accepted', ''))
            client = smtp.return_value.__enter__.return_value
            client.starttls.assert_called_once()
            message = client.send_message.call_args.args[0]
            self.assertEqual(message['To'], 'patient@example.com')


if __name__ == '__main__':
    unittest.main()
