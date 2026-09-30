import { useState } from "react";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import ProgressBar from "../components/ProgressBar";
import Button from "../components/Button";
export default function ReviewPage({ draft, onSubmit }) {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await onSubmit();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flow-container">
      <h1>Does everything look right?</h1>
      <p className="page-intro">
        Take a moment to check the details you’ve shared.
      </p>
      <ProgressBar step={4} />
      <section className="panel">
        <div className="split">
          <h2>Your pre-consultation</h2>
          <a href="#/consultation">Edit details</a>
        </div>
        <dl className="review-list">
          {[
            ["Symptoms", draft.symptoms.join(", ")],
            ["Started", draft.duration],
            ["Daily impact", draft.impact],
            ["Conditions & allergies", draft.history],
            ["Medicines", draft.medicines],
            ["Additional concerns", draft.notes],
            [
              "Attachments",
              draft.photos.length
                ? draft.photos.map((f) => f.name).join(", ")
                : "None",
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "Not provided"}</dd>
            </div>
          ))}
        </dl>
        <div className="info-strip">
          <ClipboardCheck size={23} />
          <p>
            This is a summary of your answers. AI summarisation and healthcare
            team review will be connected in a later version.
          </p>
        </div>
        <label className="consent">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />{" "}
          I’ve checked these details and understand this is a demo, not a real
          booking.
        </label>
      </section>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="flow-actions">
        <Button variant="outline" href="#/upload">
          Back
        </Button>
        <Button disabled={!confirmed || busy} onClick={submit}>
          {busy ? "Saving..." : "Preview appointment"} <ArrowRight size={16} />
        </Button>
      </div>
    </main>
  );
}
