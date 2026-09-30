# MediQueue API contract

The backend uses SQLite for local development. Authentication returns an HttpOnly `mediqueue_session` cookie and the frontend sends requests with credentials included.

## Authentication

- `POST /auth/register` accepts a name, email, and password and creates a patient account.
- `POST /auth/login` verifies a password and issues a seven-day session.
- `GET /auth/me` restores the current cookie-authenticated user.
- `POST /auth/logout` deletes the server-side session and clears the cookie.

Google sign-in is not shown because no verified backend credential exchange exists.

## Consultations and uploads

- `POST /consultations` saves an authenticated patient's answers. `submission_id` is required and idempotent per patient; a retry returns the original consultation instead of creating a duplicate. Reusing the key with different data returns `409`.
- `GET /consultations/mine/latest` restores the signed-in patient's latest submission and related status.
- `POST /consultations/{id}/images` stores an image for a consultation owned by the signed-in patient. The API checks decoded JPG/PNG/WebP content, a 5 MB limit, a three-image limit, and SHA-256 hashes for retry deduplication.

Upload storage uses generated UUID filenames under `uploads/`; supplied filenames are retained only as sanitized display metadata. An administrator can retrieve an image only through the protected image endpoint.

## Admin review and appointment offers

- `GET /admin/consultations` returns the administrator-only review queue.
- `GET /admin/consultations/{id}/images/{image_id}` returns a protected image to an administrator.
- `POST /admin/consultations/{id}/offers` publishes two to five future appointment options.
- `GET /appointments/offers?consultation_id={id}` lists unexpired options for a consultation owned by the patient.
- `POST /appointments/offers/{offer_id}/select` confirms one option and withdraws the rest in one transaction.
- `GET /appointments` returns all appointments owned by the signed-in patient.

Appointment inputs must include a timezone offset. The API normalizes them to UTC and returns ISO-8601 timestamps ending in `Z`. Selecting an expired offer returns `410`; selected, withdrawn, or resource-conflicting offers return `409`. Scheduling conflicts are scoped to the normalized department and location pair rather than globally to a timestamp.

Admin accounts are provisioned at startup with `MEDIQUEUE_ADMIN_EMAIL` and `MEDIQUEUE_ADMIN_PASSWORD`. Admin operations and patient ownership checks are enforced by the API. Frontend route visibility is not treated as authorization.

## Consultation endpoints

- POST /consultations/summary — generate a patient-response-only summary preview for the authenticated patient.
- POST /consultations — validate and save an authenticated patient's answers.
- POST /consultations/{id}/images — validate and store an authenticated patient's JPG, PNG or WebP attachment.
- GET /consultations/mine/latest — restore the signed-in patient's latest submission and appointment status.

Consultation records include a persisted `summary`, `summary_source`, `summary_model`
and `summary_generated_at`. Submission attempts local Ollama generation and saves
the result once; patient and admin endpoints return that same text. It includes
reported facts and, when supported, uncertain possible conditions for clinical
review, without diagnosis or treatment advice. A basic summary is preserved when
Ollama is unavailable or output is rejected. The legacy preview endpoint produces
only a basic summary. `POST /consultations/{id}/summary` retries basic summaries
for the owning patient or an administrator; completed AI text is returned unchanged.
See [Ollama setup and validation](ai-summary.md).

## Admin review and offers

- GET /admin/consultations — administrator-only patient consultation queue, including protected image IDs.
- GET /admin/consultations/{id}/images/{image_id} — administrator-only image viewing.
- POST /admin/consultations/{id}/offers — publish two to five future appointment options.
- GET /appointments/offers?consultation_id={id} — list options for a consultation owned by the signed-in patient.
- POST /appointments/offers/{offer_id}/select — confirm one option and withdraw the rest.

Admin accounts are provisioned at backend startup using `MEDIQUEUE_ADMIN_EMAIL`
and `MEDIQUEUE_ADMIN_PASSWORD`. Admin-only operations are enforced by the API,
not just hidden in the frontend.

## Appointment endpoints

- GET /appointments — return the authenticated patient's appointments.

## Future endpoints

- GET /doctors/consultations — role-protected healthcare review queue.

The frontend restores the authenticated user from `/auth/me` after a refresh.
The local session implementation is intended for development. Production
should move session storage to PostgreSQL or another managed store and add
CSRF protection, secure cookies and secret configuration before launch.

## Appointment confirmation notifications

`POST /auth/register` also accepts `mobile`. The backend validates and normalises provided numbers, saves them and returns `mobile` in authentication responses. Existing accounts can supply a number when selecting a date.

`POST /appointments/offers/{offer_id}/select` requires `{ "mobile": "0821234567" }`. It saves the booking and notification records, then attempts SMS and email independently. The response includes `notifications`, for example `{ "sms": "accepted", "email": "not_configured" }`. Repeating the same selection returns the existing appointment without sending again. Only the patient who owns the consultation can select the offer. Registered email is read from the authenticated account, not supplied by the booking client.

See [notification setup](notifications.md) for configuration and status meanings.

## POST /auth/admin/login

Accepts `{ "password": "..." }` without an email. Verifies the configured admin account password hash and issues the standard session cookie. Incorrect passwords return `401`.
