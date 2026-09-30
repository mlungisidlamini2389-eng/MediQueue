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

- POST /consultations — validate and save an authenticated patient's answers.
- POST /consultations/{id}/images — validate and store an authenticated patient's JPG, PNG or WebP attachment.
- GET /consultations/mine/latest — restore the signed-in patient's latest submission and appointment status.

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
