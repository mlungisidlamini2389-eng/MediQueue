import AppointmentCard from "../components/AppointmentCard";
import Button from "../components/Button";
export default function AppointmentPage() {
  return (
    <main className="flow-container appointment-page">
      <span className="eyebrow plain">THE NEXT STEP IN YOUR JOURNEY</span>
      <h1>A clearer plan for your visit.</h1>
      <p className="page-intro">
        Here’s how your appointment details will look once scheduling is
        connected.
      </p>
      <AppointmentCard />
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
