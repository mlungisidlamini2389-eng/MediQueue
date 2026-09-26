# MVP architecture

React + Vite renders the landing page and patient flow. Hash routes allow static hosting without rewrite rules. Shared authentication state lives in AuthContext; the consultation draft lives in App. Only the Google credential exchange is wired to HTTP. Clinical and appointment views use an explicitly labelled demo.

Planned production flow:

```text
React browser → FastAPI → PostgreSQL
      ↓             ↓
Google Identity    Image storage / AI summary / scheduling
```

PostgreSQL stores users, verified healthcare roles, consultations and appointments. Image storage and AI calls belong behind authenticated backend endpoints. Healthcare professionals review summaries and retain responsibility for clinical decisions.

The prototype does not persist medical details or image data. Production requires verified identity, role enforcement, server-side validation, consent and retention policies, secure image handling, session restoration/logout, and real appointment availability before accepting real patients.
