import { useEffect, useState } from "react";
import AppointmentCard from "../components/AppointmentCard";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  getAppointmentOffers,
  selectAppointmentOffer,
} from "../services/api";
export default function AppointmentPage({ demo, consultationId, existingAppointment }) {
  const { user } = useAuth();
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [offers, setOffers] = useState([]);
  const [appointment, setAppointment] = useState(existingAppointment);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (demo || !consultationId || existingAppointment) return;
    getAppointmentOffers(consultationId)
      .then(setOffers)
      .catch((loadError) => setError(loadError.message));
  }, [demo, consultationId, existingAppointment]);
  async function chooseOffer(offerId) {
    setBusy(true);
    setError("");
    try {
      setAppointment(await selectAppointmentOffer(offerId, mobile));
      setShowConfirmation(true);
    } catch (bookingError) {
      setError(bookingError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flow-container appointment-page">
      {showConfirmation && appointment && (
        <div className="confirmation-backdrop" role="presentation">
          <section
            className="confirmation-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-confirmed-title"
          >
            <span className="confirmation-icon">✓</span>
            <h2 id="appointment-confirmed-title">Appointment confirmed</h2>
            <p>
              Your visit is booked for {new Date(appointment.starts_at).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}.
            </p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => setShowConfirmation(false)}
            >
              Continue
            </button>
          </section>
        </div>
      )}
      <span className="eyebrow plain">THE NEXT STEP IN YOUR JOURNEY</span>
      <h1>A clearer plan for your visit.</h1>
      <p className="page-intro">
        {demo
          ? "Here’s how your appointment details will look once scheduling is connected."
          : appointment
            ? "Your appointment is confirmed."
            : "Your care team will send you appointment options to choose from."}
      </p>
      {demo ? (
        <AppointmentCard />
      ) : appointment ? (
        <AppointmentCard appointment={appointment} />
      ) : (
        <section className="panel appointment-picker">
          <h2>Available times</h2>
          {offers.length > 0 && <div className="login-fields">
            <label className="register-field">
              <span>Mobile number for confirmation SMS</span>
              <input type="tel" autoComplete="tel" value={mobile} onChange={event => setMobile(event.target.value)} placeholder="0821234567 or +27821234567" maxLength={32} disabled={busy} />
            </label>
            <p>Confirmation email: <strong>{user?.email}</strong></p>
            <p className="muted">Confirm your number, then choose a date to book and request SMS and email confirmations.</p>
          </div>}
          {offers.map((offer) => (
            <button
              className="slot-button"
              type="button"
              key={offer.id}
              disabled={busy || !mobile.trim()}
              onClick={() => chooseOffer(offer.id)}
            >
              <strong>{new Date(offer.starts_at).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</strong>
              <span>{offer.department} · {offer.location}</span>
            </button>
          ))}
          {!offers.length && !error && <p className="muted">No appointment options have been sent yet.</p>}
          {error && <p className="error" role="alert">{error}</p>}
        </section>
      )}
      {!demo && appointment && Object.keys(appointment.notifications || {}).length > 0 && (
        <section className="panel" aria-label="Confirmation messages" aria-live="polite">
          <h2>Confirmation messages</h2>
          {Object.entries(appointment.notifications).map(([channel, status]) => (
            <p key={channel}><strong>{channel === "sms" ? "SMS" : "Email"}:</strong> {{
              accepted: "Submitted for delivery.",
              not_configured: "Not sent. The messaging service is not connected yet.",
              failed: "Could not be sent. Your appointment is still confirmed.",
              unknown: "Delivery could not be verified. Your appointment is still confirmed.",
              pending: "Not sent yet. Your appointment is confirmed.",
              sending: "Delivery has not been confirmed yet.",
            }[status] || "Delivery status unavailable."}</p>
          ))}
        </section>
      )}
      <div className="panel visit-checklist">
        <h2>A little preparation goes a long way.</h2>
        <ul>
          <li>Bring your identification and any hospital documents.</li>
          <li>Keep a list of your current medicines handy.</li>
          <li>Check your appointment location before leaving.</li>
        </ul>
      </div>
      <Button href="#/dashboard">Back to my dashboard</Button>
    </main>
  );
}
