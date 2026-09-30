import { useState } from "react";
import { ArrowRight } from "lucide-react";
import ProgressBar from "../components/ProgressBar";
import Button from "../components/Button";
import PatientSummary from "../components/PatientSummary";

function buildDemoSummary(draft) {
  const context = [
    draft.history ? `Conditions or allergies reported: ${draft.history}` : "Conditions or allergies were not provided.",
    draft.medicines ? `Current medicines reported: ${draft.medicines}` : "Current medicines were not provided.",
    draft.notes ? `Additional concerns reported: ${draft.notes}` : "Additional concerns were not provided.",
  ];
  return `The patient reports ${draft.symptoms.join(", ")}. The reported onset is ${draft.duration}, and the reported daily impact is ${draft.impact}.\n\n${context.join(" ")}\n\nThis summary is based only on the patient's responses. It does not diagnose a condition or recommend treatment. A healthcare professional should review this summary and the original responses.`;
}

export default function ReviewPage({ draft, demo, savedReview, onSummaryUpdate, onSubmit }) {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await onSubmit();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flow-container">
      <h1>{savedReview ? "Your submitted pre-consultation" : "Does everything look right?"}</h1>
      <p className="page-intro">{savedReview ? "You and your healthcare professional see the same saved summary." : "Check your answers before submitting them for review."}</p>
      <ProgressBar step={4} />
      {savedReview && <PatientSummary record={savedReview} onUpdate={onSummaryUpdate} />}
      <section className="panel">
        <div className="split">
          <h2>{savedReview ? "Your original responses" : "Your pre-consultation"}</h2>
          {!savedReview && <a href="#/consultation">Edit details</a>}
        </div>
        <dl className="review-list">
          {[
            ["Symptoms", draft.symptoms.join(", ")],
            ["Started", draft.duration],
            ["Daily impact", draft.impact],
            ["Conditions & allergies", draft.history],
            ["Medicines", draft.medicines],
            ["Additional concerns", draft.notes],
            ["Attachments", draft.photos.length ? draft.photos.map(file => file.name).join(", ") : "None in this view"],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>)}
        </dl>
        {demo && <PatientSummary record={{ summary: buildDemoSummary(draft), summary_source: "basic" }} />}
        {!savedReview && <>
          <p>{demo ? "The demo uses a basic summary and does not contact an AI model." : "On submission, Ollama will use these written responses to prepare a summary and possible conditions for clinical review. Photos are not analysed. This does not provide a diagnosis or treatment."}</p>
          <label className="consent">
            <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />{" "}
            {demo ? "I've checked these details and understand this is a demo, not a real booking." : "I've checked my responses and understand the AI summary requires healthcare professional review."}
          </label>
        </>}
      </section>
      {error && <p className="error" role="alert">{error}</p>}
      {busy && <p role="status">Saving your responses and preparing the summary. Local AI can take a few minutes.</p>}
      <div className="flow-actions">
        {savedReview ? <Button href="#/appointment">View appointment options <ArrowRight size={16} /></Button> : <>
          <Button variant="outline" href="#/upload">Back</Button>
          <Button disabled={!confirmed || busy} onClick={submit}>
            {busy ? "Preparing summary..." : demo ? "Preview appointment" : "Submit questionnaire"} <ArrowRight size={16} />
          </Button>
        </>}
      </div>
    </main>
  );
}
