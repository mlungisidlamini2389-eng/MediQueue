import {
  ArrowRight,
  ClipboardList,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import AppointmentCard from "../components/AppointmentCard";
export default function PatientDashboard({
  draft,
  submitted,
  demo,
  appointment,
  loading,
  error,
}) {
  const { user } = useAuth();
  return (
    <main className="container workspace">
      <span className="eyebrow plain">YOUR PATIENT SPACE</span>
      <h1>
        Hello, {user?.name?.split(" ")[0] || "Sibusiso"}{" "}
        <span className="wave">☀</span>
      </h1>
      <p className="page-intro">A calmer hospital visit starts here.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="dashboard-grid">
        <section className="panel dashboard-start">
          <span className="large-icon">
            <ClipboardList size={30} />
          </span>
          <h2>Let’s prepare for your visit.</h2>
          <p>
            Tell your healthcare team how you’re feeling, in your own time. It
            takes just a few minutes.
          </p>
          <ul className="check-list">
            <li>Share your symptoms</li>
            <li>Add any other details</li>
            <li>Review your information</li>
          </ul>
          <Button
            href={
              submitted
                ? demo
                  ? "#/review"
                  : "#/appointment"
                : "#/consultation"
            }
          >
            {submitted
              ? demo
                ? "View your pre-consultation"
                : "View appointment options"
              : draft.symptoms.length
                ? "Continue pre-consultation"
                : "Start pre-consultation"}
            <ArrowRight size={18} />
          </Button>
        </section>
        {loading ? (
          <section className="panel empty-appointment" role="status">
            <CalendarDays size={38} />
            <h2>Loading your appointment</h2>
          </section>
        ) : appointment ? (
          <AppointmentCard appointment={appointment} />
        ) : demo && submitted ? (
          <AppointmentCard demo />
        ) : (
          <section className="panel empty-appointment">
            <CalendarDays size={38} />
            <h2>Your next appointment</h2>
            <p>
              {submitted
                ? "Your consultation is saved. Your care team has not sent or confirmed an appointment yet."
                : "No appointment yet. Complete your pre-consultation to begin."}
            </p>
            <span className="pill">Ready when you are</span>
          </section>
        )}
      </div>
      <div className="info-strip">
        <Sparkles size={22} />
        <p>
          <strong>Your words matter.</strong> Share what’s been bothering you. A
          healthcare professional makes the medical decisions.
        </p>
      </div>
    </main>
  );
}
