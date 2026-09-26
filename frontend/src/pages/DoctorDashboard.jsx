import { ClipboardCheck } from "lucide-react";
import Button from "../components/Button";
export default function DoctorDashboard() {
  return (
    <main className="container workspace">
      <span className="eyebrow plain">FOR HEALTHCARE TEAMS</span>
      <h1>More context. More time for care.</h1>
      <section className="panel empty-appointment">
        <ClipboardCheck size={44} />
        <h2>The healthcare workspace is coming next.</h2>
        <p>
          Patient summaries, appointment availability and clinical review will
          be added after the patient MVP. Access will require a verified
          healthcare role.
        </p>
        <Button href="#/">Back to home</Button>
      </section>
    </main>
  );
}
