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

## Current behavior

- Database-backed patient registration, password sign-in, and seven-day cookie sessions.
- Separate in-memory patient demo that needs no account.
- Persistent pre-consultation submission with retry-safe IDs.
- Optional verified JPG, PNG, and WebP uploads, limited to three per consultation.
- Administrator review and appointment offers.
- Patient selection and persistent confirmation of one offered appointment.
- Keyboard-accessible forms, validation, mobile navigation, and reduced-motion support.

Use fictional information. Demo answers and images stay in React memory. Signed-in consultation data, verified attachments, offers, and confirmed appointments are stored by the local backend. No AI inference, medical triage, live queueing, clinician workflow, or external hospital scheduling is implemented.

## Create the first admin

Set these values in the same terminal before starting the backend:

```powershell
$env:MEDIQUEUE_ADMIN_EMAIL = "admin@example.com"
$env:MEDIQUEUE_ADMIN_PASSWORD = "choose-a-strong-private-password"
$env:MEDIQUEUE_ADMIN_NAME = "MediQueue Admin"
```

Startup creates or promotes that account and resets its password to the configured value. Sign in through the normal admin login. Keep these values out of frontend configuration and source control.

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

```powershell
cd backend
.venv\Scripts\python -m pytest -q
```

Run the frontend build and Playwright suite:

```powershell
cd frontend
npm run build
npx playwright install chromium
npm test
```

The Playwright configuration starts both FastAPI and the built frontend. It covers the authenticated patient/admin booking flow, persistent confirmation, access control, the demo journey, form validation, mobile navigation, and layout overflow. If Microsoft Edge is already installed, set `PLAYWRIGHT_CHANNEL=msedge` instead of downloading Chromium.
