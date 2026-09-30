# Local AI patient summaries with Ollama

MediQueue uses a local Ollama model to write a readable account of the patient's reported symptoms, timing, daily impact, medical history, allergies, medicines and notes. Possible diseases are separated as uncertain conditions to discuss with a healthcare professional. The system must not diagnose, prescribe or add unreported symptoms.

## Setup on Windows

1. Install and open [Ollama for Windows](https://ollama.com/download/windows).
2. In a terminal, download the default local model:

   ```powershell
   ollama pull llama3.2:3b
   ```

3. Ollama normally runs locally at `http://127.0.0.1:11434`. If it is not running, use `ollama serve`.
4. Restart the MediQueue backend. No OpenAI API key or paid cloud API is required.

Optional backend environment settings (set before starting the backend):

```powershell
$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "llama3.2:3b"
$env:OLLAMA_TIMEOUT_SECONDS = "60"
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

`.env.example` documents the settings; it is not loaded automatically. Only loopback Ollama URLs are accepted. The default model is a general-purpose local model, not a clinically validated diagnostic system. Larger models may give better results but need additional RAM and evaluation. Each summary uses two model calls; slower computers may need up to 90 seconds per call.

## How the shared summary works

Submission saves the original answers first, generates a summary, and saves its exact text, source, model and timestamp with the consultation. The patient stays on the review page to see it. The admin review reads that same stored text; reading either page never regenerates it. Refreshing restores the saved summary. Successful Ollama summaries are immutable. Editing the questionnaire starts a new submission rather than silently changing an earlier summary.

Older summaries are labelled basic. When Ollama is unavailable, times out, returns malformed data, or fails output checks, the app retains a clearly labelled basic response summary with no disease suggestions. The patient or administrator can select **Try AI summary** after setting up Ollama. Only the consultation owner or an administrator can request generation. Concurrent requests cannot generate twice for the same record. A backend restart recovers interrupted generation to a retryable basic state.

## Grounding and clinical limits

The model receives written questionnaire fields only, not account identifiers, email, phone, photos or unrelated patient records. Free text may still contain personal information entered by the patient. It is sent to the local Ollama process. Demo mode makes no model requests.

Output uses [Ollama structured JSON](https://docs.ollama.com/capabilities/structured-outputs), validates evidence quotes against the submitted fields, then runs a second model review for unsupported facts, omissions, diagnostic certainty and treatment advice. Unverified output is discarded. Every accepted summary ends with a fixed healthcare-review disclaimer. Original responses remain visible for comparison. AI validation reduces errors but cannot guarantee medical correctness or eliminate hallucinations; professional review is required. These checks are not a clinical validation or emergency triage system.

## API and checks

- `POST /consultations` saves answers and the generated summary; returns `summary`, `summary_source` (`ollama` or `basic`), `summary_model`, and `summary_generated_at`.
- `GET /consultations/mine/latest` and `GET /admin/consultations` return the same saved fields.
- `POST /consultations/{id}/summary` retries only basic summaries; a completed AI summary is returned unchanged.
- `POST /consultations/summary` remains a basic preview for compatibility; it does not call Ollama or produce disease suggestions.

Run `python -m unittest discover -s tests -v` in `backend` using the project's Python environment, and `npm test` in `frontend`. Automated tests mock Ollama; they verify evidence rejection, failure handling, access checks and shared persistence. Evaluate local model quality using fictional cases before real clinical use.
