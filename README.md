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
- Patient-response summary shown in review and the admin consultation queue.
- Keyboard-accessible forms, validation, mobile navigation and reduced-motion support.
- Role-protected admin review of submitted prototype data and appointment options.

Use fictional information. Demo answers and image files stay in React memory and are never uploaded. Signed-in consultation data, summaries, and uploaded attachments are stored by the local backend for review. Ollama can suggest possible conditions for clinical discussion, but must not diagnose or recommend treatment; a healthcare professional must review the summary against the original answers.

## Prototype accounts

Patient accounts are stored in the local SQLite database. Patients can submit
consultations, and an administrator can review them and offer appointment dates
for the patient to choose.

### Admin login

Choose **Log in as Admin** on the home page and enter the local prototype password `Admin@`. No email is required. Restart the backend after updating to initialise the admin account.

The backend hashes the password and verifies it before issuing a session cookie. The local default account is `admin@mediqueue.local`. Set `MEDIQUEUE_ADMIN_EMAIL`, `MEDIQUEUE_ADMIN_PASSWORD`, and optionally `MEDIQUEUE_ADMIN_NAME` to override the defaults. An existing password override takes precedence. Use a private password before sharing or deploying the app.

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

## Appointment SMS and email

When a patient selects an offered date, MediQueue saves the booking and requests SMS and email confirmations using the confirmed mobile number and registered email. Connect Twilio and SMTP before expecting live messages. See [notification setup and status details](docs/notifications.md). The confirmation screen reports unavailable services or sending failures without cancelling the booking.

## Ollama patient summaries

Install Ollama, run `ollama pull llama3.2:3b`, and keep Ollama running locally. After submission, the patient and admin see the exact same stored summary, including cautious possible conditions when supported by the responses. If Ollama is unavailable or output fails validation, a basic summary is clearly labelled and can be retried. See [setup, validation and limitations](docs/ai-summary.md). No OpenAI API key is needed.

## Frontend checks

```sh
cd frontend
npm run build
npx playwright install chromium
npm test
```

If Microsoft Edge is already installed, set `PLAYWRIGHT_CHANNEL=msedge` instead of downloading Chromium. Tests cover the demo journey, required symptom selection, attachment removal, review confirmation, mobile navigation and layout overflow. Run tests without a configured Google client ID to exercise the initial setup state.
