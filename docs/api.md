# MediQueue API contract

The backend uses SQLite for local development. Authentication returns an
HttpOnly `mediqueue_session` cookie and the frontend sends requests with
credentials included.

## POST /auth/register

Accepts `{ "name": "Patient name", "email": "patient@example.com", "password": "at-least-six-characters" }` and returns `201` with the authenticated user.

## POST /auth/login

Accepts `{ "email": "patient@example.com", "password": "..." }` and returns `200` with the authenticated user. Invalid credentials return `401`.

## GET /auth/me

Returns the current cookie-authenticated user. Missing or expired sessions return `401`.

## POST /auth/logout

Deletes the current server session and clears the cookie. Returns `204`.

## POST /auth/google

The frontend sends JSON `{ "credential": "<Google ID token>" }` with credentials included. Google verification is not implemented yet and should be added only with server-side signature, issuer, audience and expiry validation.

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
