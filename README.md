# MediQueue

A React/Vite and FastAPI prototype for patient pre-consultation and administrator-offered appointment booking.

## Run locally

Install Node.js 22 LTS or later and Python 3.11 or later. Run the backend and frontend in separate PowerShell terminals:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python -m uvicorn main:app --reload
```

```powershell
cd frontend
npm ci
npm run dev
```

## MVP features

- Responsive landing page inspired by the supplied MediQueue reference.
- Database-backed patient sign-in and registration, plus optional Google sign-in when configured.
- Separate patient demo for exploring the flow without an account.
- Patient dashboard, symptom questionnaire, image upload, review, and admin-offered appointment selection.
- Patient-response summary shown in review and the admin consultation queue.
- Keyboard-accessible forms, validation, mobile navigation and reduced-motion support.
- Role-protected admin review of submitted prototype data and appointment options.

Use fictional information. Demo answers and image files stay in React memory and are never uploaded. Signed-in consultation data, summaries, and uploaded attachments are stored by the local backend for review. Ollama can suggest possible conditions for clinical discussion, but must not diagnose or recommend treatment; a healthcare professional must review the summary against the original answers.

Use fictional information. Demo answers and images stay in React memory. Signed-in consultation data, verified attachments, offers, and confirmed appointments are stored by the local backend. No AI inference, medical triage, live queueing, clinician workflow, or external hospital scheduling is implemented.

## Create the first admin

### Admin login

Choose **Log in as Admin** on the home page and enter the local prototype password `Admin@`. No email is required. Restart the backend after updating to initialise the admin account.

The backend hashes the password and verifies it before issuing a session cookie. The local default account is `admin@mediqueue.local`. Set `MEDIQUEUE_ADMIN_EMAIL`, `MEDIQUEUE_ADMIN_PASSWORD`, and optionally `MEDIQUEUE_ADMIN_NAME` to override the defaults. An existing password override takes precedence. Use a private password before sharing or deploying the app.

## Configuration and persistence

The frontend defaults to `http://127.0.0.1:8000`. Override it in `frontend/.env.local` when needed:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

Google sign-in is hidden because the backend does not implement verified Google credentials. Local registration and password sign-in remain available.

FastAPI uses SQLite. The schema and safe additive updates live in `backend/app/database.py`; the project does not use separate SQL schema or seed files. Uploaded files use generated names under `uploads/`; metadata lives in SQLite.

Appointment inputs require an explicit timezone. The backend normalizes and stores UTC ISO-8601 values ending in `Z`; browsers render them in the viewer's local timezone. Scheduling conflicts use department plus location, the smallest scheduling resource represented by the current model.

This remains a local prototype. Production requires managed persistence and file storage, HTTPS secure cookies, CSRF protection, verified staff identity, audit trails, retention/deletion controls, isolated image processing, and integration with a real scheduling system.

## Validation

Run the backend suite:

## Appointment SMS and email

When a patient selects an offered date, MediQueue saves the booking and requests SMS and email confirmations using the confirmed mobile number and registered email. Connect Twilio and SMTP before expecting live messages. See [notification setup and status details](docs/notifications.md). The confirmation screen reports unavailable services or sending failures without cancelling the booking.

## Ollama patient summaries

Install Ollama, run `ollama pull llama3.2:3b`, and keep Ollama running locally. After submission, the patient and admin see the exact same stored summary, including cautious possible conditions when supported by the responses. If Ollama is unavailable or output fails validation, a basic summary is clearly labelled and can be retried. See [setup, validation and limitations](docs/ai-summary.md). No OpenAI API key is needed.

## Frontend checks

```powershell
cd frontend
npm run build
npx playwright install chromium
npm test
```

The Playwright configuration starts both FastAPI and the built frontend. It covers the authenticated patient/admin booking flow, persistent confirmation, access control, the demo journey, form validation, mobile navigation, and layout overflow. If Microsoft Edge is already installed, set `PLAYWRIGHT_CHANNEL=msedge` instead of downloading Chromium.
