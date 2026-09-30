# MediQueue

A React + Vite frontend for a smart hospital queue and pre-consultation service.

## Run the frontend

Install Node.js 22 LTS or later, then run:

```sh
cd frontend
npm install
npm run dev
```
$env:Path = "$PWD\node-v22.23.3-win-x64;$env:Path"
cd frontend
npm.cmd run dev
```

## MVP features

- Responsive landing page inspired by the supplied MediQueue reference.
- Database-backed patient sign-in and registration, plus optional Google sign-in when configured.
- Separate patient demo for exploring the flow without an account.
- Patient dashboard, symptom questionnaire, image upload, review, and admin-offered appointment selection.
- Keyboard-accessible forms, validation, mobile navigation and reduced-motion support.
- Role-protected admin review of submitted prototype data and appointment options.

Use fictional information. Demo answers and image files stay in React memory and are never uploaded. Signed-in consultation data and uploaded attachments are stored by the local backend for review. No AI inference or medical triage is performed.

## Prototype accounts

Patient accounts are stored in the local SQLite database. Patients can submit
consultations, and an administrator can review them and offer appointment dates
for the patient to choose.

### Create the first admin

Set these environment variables in the same PowerShell terminal before starting
the backend. Use your own email and a strong private password:

```powershell
$env:MEDIQUEUE_ADMIN_EMAIL = "admin@example.com"
$env:MEDIQUEUE_ADMIN_PASSWORD = "choose-a-strong-private-password"
$env:MEDIQUEUE_ADMIN_NAME = "MediQueue Admin"
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

On startup, the backend creates or promotes that account to the admin role and
sets its password to `MEDIQUEUE_ADMIN_PASSWORD`. Sign in through the normal
login page with those credentials, then open `#/admin`. Do not expose these
environment values in frontend configuration or commit them to source control.

## Google sign-in

Create `frontend/.env.local` with:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id
```

Configure the Google OAuth web client with `http://localhost:5173` as an authorised JavaScript origin, and restart Vite. Without a client ID the Google button is disabled; local prototype sign-in and registration remain available.

The frontend uses the official [Google Identity Services button](https://developers.google.com/identity/gsi/web/reference/js-reference). It sends the returned credential to `POST /auth/google`. This endpoint is not implemented yet. The future backend must verify the token's signature, issuer, audience and expiry, upsert the user in PostgreSQL and return `{ "user": { "id": "...", "name": "...", "email": "..." } }` with a secure HttpOnly session cookie. Never trust client-decoded Google claims for authentication or authorisation.

Sessions restore through `/auth/me`, and “Leave session” revokes the backend session. Production still needs secure-cookie deployment, CSRF controls, and a managed database.

## Backend and database

FastAPI with SQLite is currently used for local development. The browser accesses data through FastAPI; it never connects directly to the database. Admin credentials are configured only in the backend environment. Variables prefixed with `VITE_` are public browser configuration.

Next work: production database migrations, verified Google authentication, clinician roles and review workflow, and integration with a real appointment availability source.

## Frontend checks

```sh
cd frontend
npm run build
npx playwright install chromium
npm test
```

If Microsoft Edge is already installed, set `PLAYWRIGHT_CHANNEL=msedge` instead of downloading Chromium. Tests cover the demo journey, required symptom selection, attachment removal, review confirmation, mobile navigation and layout overflow. Run tests without a configured Google client ID to exercise the initial setup state.
