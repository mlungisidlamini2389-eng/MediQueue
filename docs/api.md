# Planned API contract

No backend endpoints are implemented in this frontend milestone.

## POST /auth/google

The frontend sends JSON `{ "credential": "<Google ID token>" }` with credentials included. The server must verify the token and return a user plus an HttpOnly session cookie. The frontend only sets user state after a successful response.

```json
{ "user": { "id": "uuid", "name": "Patient name", "email": "patient@example.com" } }
```

Use 401 for invalid credentials and JSON error responses. Allow only approved frontend origins with credentialed CORS. Design CSRF protection with the session endpoints.

## Future endpoints

- GET /auth/me — restore a verified session.
- POST /auth/logout — revoke the server session.
- POST /consultations — validate and save a patient's answers.
- POST /consultations/{id}/images — validate and store authorised attachments.
- GET /appointments — return the authenticated patient's appointments.
- GET /doctors/consultations — role-protected healthcare review queue.

Questionnaire, photo preview and sample appointment screens currently make no API calls.
