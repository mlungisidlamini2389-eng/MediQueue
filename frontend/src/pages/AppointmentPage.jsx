import { useEffect, useState } from "react";
import AppointmentCard from "../components/AppointmentCard";
import Button from "../components/Button";
import { getAppointmentOffers, selectAppointmentOffer } from "../services/api";
export default function AppointmentPage({
  demo,
  consultationId,
  existingAppointment,
  onAppointmentBooked,
}) {
  const [offers, setOffers] = useState([]);
  const [appointment, setAppointment] = useState(existingAppointment);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setAppointment(existingAppointment);
  }, [existingAppointment]);
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
      const confirmed = await selectAppointmentOffer(offerId);
      setAppointment(confirmed);
      onAppointmentBooked?.(confirmed);
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
              Your visit is booked for{" "}
              {new Date(appointment.starts_at).toLocaleString([], {
                dateStyle: "full",
                timeStyle: "short",
              })}
              .
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
        <AppointmentCard demo />
      ) : appointment ? (
        <AppointmentCard appointment={appointment} />
      ) : (
        <section className="panel appointment-picker">
          <h2>Available times</h2>
          {offers.map((offer) => (
            <button
              className="slot-button"
              type="button"
              key={offer.id}
              disabled={busy}
              onClick={() => chooseOffer(offer.id)}
            >
              <strong>
                {new Date(offer.starts_at).toLocaleString([], {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </strong>
              <span>
                {offer.department} · {offer.location}
              </span>
            </button>
          ))}
          {!offers.length && !error && (
            <p className="muted">No appointment options have been sent yet.</p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
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
