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

The local session implementation is intended for development. Production requires HTTPS secure cookies, CSRF protection, managed session/database storage, secret management, audit logging, and explicit data retention/deletion controls.
