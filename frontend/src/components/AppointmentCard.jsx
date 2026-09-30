import { CalendarDays, Clock3, MapPin, Building2, Check } from "lucide-react";
export default function AppointmentCard({ compact = false, appointment }) {
  const details = appointment
    ? [
        [CalendarDays, "Date", new Date(appointment.starts_at).toLocaleDateString()],
        [Clock3, "Time", new Date(appointment.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })],
        [Building2, "Department", appointment.department],
        [MapPin, "Location", appointment.location],
      ]
    : [
        [CalendarDays, "Date", "Tuesday, 20 October"],
        [Clock3, "Time", "10:30 AM"],
        [Building2, "Department", "General medicine"],
        [MapPin, "Location", "Demo Hospital · Block B"],
      ];
  return (
    <div className={`appointment-card ${compact ? "compact" : ""}`}>
      <div className="appointment-status">
        <span className="check-circle">
          <Check size={compact ? 19 : 26} />
        </span>
        <strong>
          {appointment ? "Your appointment is confirmed" : compact ? "Your visit, planned." : "Your sample appointment"}
        </strong>
        <span className="muted">
          {compact
            ? "A little less waiting."
            : appointment ? "Your care team has your pre-consultation." : "Demo only · no appointment has been booked"}
        </span>
      </div>
      <div className="appointment-details">
        {details.map(([Icon, label, value]) => (
          <div className="detail-row" key={label}>
            <span className="detail-icon">
              <Icon size={18} />
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>
      <p className="appointment-note">
        Please arrive 10 minutes before your scheduled time.
      </p>
    </div>
  );
}
