# Appointment confirmation messages

After a signed-in patient selects an offered appointment, MediQueue saves the booking and attempts an SMS and an email. The SMS uses the mobile number confirmed on the appointment page; the email uses the patient's registered address. Registration now saves the mobile number. Existing patients can provide a missing number when booking.

Messages include the appointment date and time in South African Standard Time (UTC+02:00), location and a reminder to bring identification. They do not include symptoms, photos or clinical notes. Local South African numbers such as `0821234567` are stored as `+27821234567`; international numbers must include `+` and their country code.

## Connect sending services

Configure these variables in the terminal that starts the backend. The root `.env.example` is a reference; the application does not automatically load it.

```powershell
$env:TWILIO_ACCOUNT_SID = "your-account-sid"
$env:TWILIO_AUTH_TOKEN = "your-auth-token"
$env:TWILIO_FROM_NUMBER = "+your-twilio-sender-number"
$env:SMTP_HOST = "your-smtp-host"
$env:SMTP_PORT = "587"
$env:SMTP_SECURITY = "starttls"
$env:SMTP_FROM = "appointments@your-domain.example"
$env:SMTP_USERNAME = "your-smtp-username"
$env:SMTP_PASSWORD = "your-smtp-password"
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Use `SMTP_SECURITY=ssl` with port `465` when your email service requires implicit TLS. Credentials stay on the backend. SMS requires an SMS-capable Twilio sender and an enabled destination. Twilio trial accounts require verified recipients. See [Twilio's Messages API](https://www.twilio.com/docs/messaging/api/message-resource).

## Status and failures

The booking response and restored appointment contain `notifications`, with one status per channel. `accepted` means submitted to the provider, not confirmed delivery to the recipient. Final carrier or inbox delivery tracking is not implemented.

Missing settings produce `not_configured`; provider rejections produce `failed`; uncertain results such as timeouts produce `unknown`. The booking remains confirmed if either channel fails. The patient sees these statuses on the appointment page. SMS and email are attempted independently with bounded connection timeouts.

Notification records are saved in the same database transaction as the booking. Selecting the same confirmed offer again returns the existing booking without sending duplicate messages. Each channel is claimed before sending; there are no automatic retries. If the process stops mid-send, a record may remain `sending`; check the provider before manually resending to avoid duplicates. Pending or failed records are not automatically retried when configuration is added later. Configure services before new bookings.

The demo never sends messages. Automated tests use fake recipients and mocked providers.

## Verification

```powershell
cd backend
python -m unittest discover -s tests -v
```

Frontend checks: run `npm test` from `frontend`.
