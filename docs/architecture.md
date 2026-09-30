# MVP architecture

MediQueue consists of a React/Vite browser application and a FastAPI API backed by SQLite. Hash routes allow static frontend hosting without rewrite rules. `AuthContext` restores the HttpOnly cookie session; `App` owns the active consultation draft and synchronizes the latest persisted consultation and confirmed appointment after authentication.

```text
React browser → FastAPI → SQLite
                     ├── users and cookie sessions
                     ├── consultations and appointment offers
                     ├── confirmed appointments
                     └── upload metadata → generated files in uploads/
```

Authenticated patient submissions are persistent. A client-generated submission ID is unique per patient, so retrying a consultation submission reuses the saved consultation. Images are uploaded separately, verified by decoded image content, limited to three per consultation, and deduplicated by SHA-256 content hash. The API checks consultation ownership for every patient image operation.

Administrators can review all submitted consultations and offer two to five future appointment options. Incoming timezone-aware timestamps are normalized to UTC and stored as ISO-8601 values ending in `Z`. Browsers convert those explicit UTC values to the viewer's local timezone. Confirmed appointments use the existing department and location as the scheduling resource, allowing independent resources to share a timestamp while preventing a resource from being double-booked.

Demo mode remains entirely in browser memory and shows explicitly labelled sample appointment data. Google authentication, clinician workflows, AI summarization/triage, live hospital queues, and external hospital scheduling are not implemented. The informational healthcare screen does not grant a clinician role.

The SQLite schema is created and incrementally updated in `backend/app/database.py`; there is no separate SQL migration framework. Production still requires managed persistence, HTTPS secure cookies, CSRF protection, audit trails, retention/deletion policy, malware scanning or isolated image processing, verified staff identity, and integration with a real scheduling resource system.
