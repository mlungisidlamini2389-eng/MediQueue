from datetime import datetime, timezone
import json
import os
from urllib.error import HTTPError, URLError

from app.schemas.consultation import ConsultationCreate
from app.services.basic_summary import generate_patient_summary
from app.services.ollama_summary import generate_ollama_summary


def stored_summary(row):
    return {key: row[key] for key in ('summary', 'summary_source', 'summary_model', 'summary_generated_at')}


def generate_saved_summary(consultation_id):
    from app.database import get_connection
    with get_connection() as connection:
        row = connection.execute('SELECT * FROM consultations WHERE id = ?', (consultation_id,)).fetchone()
        if row is None:
            raise ValueError('Consultation not found')
        claimed = connection.execute("UPDATE consultations SET summary_source = 'generating' WHERE id = ? AND summary_source = 'basic'", (consultation_id,)).rowcount
        if not claimed:
            return stored_summary(row)
    payload = ConsultationCreate.model_validate({
        **{key: row[key] for key in ('duration', 'impact', 'history', 'medicines', 'notes')},
        'symptoms': json.loads(row['symptoms']),
    })
    summary_error = ''
    try:
        summary = generate_ollama_summary(payload)
        source = 'ollama'
        model = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')
    except Exception as error:
        # Preserve patient responses and never show rejected model content.
        summary = generate_patient_summary(payload)
        source, model = 'basic', ''
        if isinstance(error, HTTPError) and error.code == 404:
            summary_error = 'The configured Ollama model is not installed. Download it with ollama pull, then try again.'
        elif isinstance(error, TimeoutError) or (isinstance(error, URLError) and isinstance(error.reason, TimeoutError)):
            summary_error = 'Ollama took too long to respond. Allow the model to finish loading, then try again.'
        elif isinstance(error, HTTPError):
            summary_error = 'Ollama could not run the configured model. Check that it is installed and the computer has enough free memory.'
        elif isinstance(error, URLError):
            summary_error = 'Ollama is not running or cannot be reached. Open Ollama or run ollama serve, then try again.'
        elif isinstance(error, ValueError):
            summary_error = 'The AI response did not pass the summary checks. Your basic summary is saved. Try again or ask your healthcare professional to review the original answers.'
        else:
            summary_error = 'The AI summary could not be prepared. Your responses and basic summary are saved.'
    generated_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        connection.execute('UPDATE consultations SET summary = ?, summary_source = ?, summary_model = ?, summary_generated_at = ? WHERE id = ?', (summary, source, model, generated_at, consultation_id))
    return dict(summary=summary, summary_source=source, summary_model=model, summary_generated_at=generated_at, summary_error=summary_error)
