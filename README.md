# MediQueue

A React + Vite frontend for a smart hospital queue and pre-consultation service.

## Run the frontend

Install Node.js 22 LTS or later, then run:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Run `npm run build` for a production build or `npm run preview` to preview it.

If using the portable Node runtime downloaded in this workspace on Windows, add it to your terminal's PATH first (PowerShell):

```powershell
$env:Path = "$PWD\node-v22.23.3-win-x64;$env:Path"
cd frontend
npm.cmd run dev
```

## MVP features

- Responsive landing page inspired by the supplied MediQueue reference.
- Google-only sign-in screen with an explicit setup state.
- Separate patient demo; it does not create an authenticated session.
- Patient dashboard, symptom questionnaire, optional image previews, review and sample appointment.
- Keyboard-accessible forms, validation, mobile navigation and reduced-motion support.
- Healthcare workspace placeholder. No access to real patient records.

Use fictional information. Demo answers and image files stay in React memory, are never uploaded, and disappear on refresh or when leaving the demo. Sample appointments are fixed illustrations, not actual bookings. No AI inference or medical triage is performed.

## Google sign-in

Create `frontend/.env.local` with:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id
```

Configure the Google OAuth web client with `http://localhost:5173` as an authorised JavaScript origin, and restart Vite. Without a client ID the Google button is disabled and the demo remains available.

The frontend uses the official [Google Identity Services button](https://developers.google.com/identity/gsi/web/reference/js-reference). It sends the returned credential to `POST /auth/google`. This endpoint is not implemented yet. The future backend must verify the token's signature, issuer, audience and expiry, upsert the user in PostgreSQL and return `{ "user": { "id": "...", "name": "...", "email": "..." } }` with a secure HttpOnly session cookie. Never trust client-decoded Google claims for authentication or authorisation.

Session restoration and server-side logout are not implemented. “Leave session” clears the frontend view only; production authentication must add session/logout endpoints and appropriate CSRF and CORS controls before launch.

## Backend and database

FastAPI and PostgreSQL are planned; their scaffold files are currently placeholders. The browser must access data through FastAPI, never connect directly to PostgreSQL. Keep `DATABASE_URL` and other secrets on the server. Variables prefixed with `VITE_` are public browser configuration.

Next work: verified authentication and session lifecycle, PostgreSQL models/migrations, consultation storage, protected image upload, clinician access, AI summary review and appointment availability.

## Frontend checks

```sh
cd frontend
npm run build
npx playwright install chromium
npm test
```

If Microsoft Edge is already installed, set `PLAYWRIGHT_CHANNEL=msedge` instead of downloading Chromium. Tests cover the demo journey, required symptom selection, attachment removal, review confirmation, mobile navigation and layout overflow. Run tests without a configured Google client ID to exercise the initial setup state.
