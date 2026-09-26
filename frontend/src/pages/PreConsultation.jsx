import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import Button from "../components/Button";
export default function PreConsultation({ draft, setDraft }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const update = (key, value) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  function next(event) {
    event.preventDefault();
    if (step === 1) {
      if (!draft.symptoms.length)
        return setError("Select at least one symptom to continue.");
      setError("");
      setStep(2);
    } else window.location.hash = "/upload";
  }
  return (
    <main className="flow-container">
      <a href="#/dashboard" className="back-link">
        <ArrowLeft size={16} /> My dashboard
      </a>
      <h1>Let’s talk about how you feel.</h1>
      <p className="page-intro">
        A little information helps your care team prepare.
      </p>
      <ProgressBar step={step} />
      <form onSubmit={next}>
        {step === 1 ? (
          <QuestionCard
            title="What’s been bothering you?"
            description="Choose all that apply. You can add more details in a moment."
          >
            <fieldset className="symptom-grid">
              <legend className="sr-only">Your symptoms</legend>
              {[
                "Fever",
                "Cough",
                "Headache",
                "Stomach pain",
                "Fatigue",
                "Sore throat",
                "Body aches",
                "Other",
              ].map((symptom) => (
                <label
                  key={symptom}
                  className={`symptom-option ${draft.symptoms.includes(symptom) ? "checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={draft.symptoms.includes(symptom)}
                    onChange={(event) =>
                      update(
                        "symptoms",
                        event.target.checked
                          ? [...draft.symptoms, symptom]
                          : draft.symptoms.filter((item) => item !== symptom),
                      )
                    }
                  />
                  {symptom}
                </label>
              ))}
            </fieldset>
            <label className="field-label">
              When did this start?
              <select
                required
                value={draft.duration}
                onChange={(e) => update("duration", e.target.value)}
              >
                <option value="">Select a timeframe</option>
                <option>Today</option>
                <option>1–3 days ago</option>
                <option>4–7 days ago</option>
                <option>More than a week ago</option>
              </select>
            </label>
          </QuestionCard>
        ) : (
          <QuestionCard
            title="A little about your health"
            description="Add anything you would like the healthcare professional to know."
          >
            <label className="field-label">
              How much is this affecting your day?
              <select
                required
                value={draft.impact}
                onChange={(e) => update("impact", e.target.value)}
              >
                <option value="">Select an option</option>
                <option>I can do my usual activities</option>
                <option>Some activities are difficult</option>
                <option>My usual activities are very difficult</option>
              </select>
            </label>
            <label className="field-label">
              Existing conditions or allergies{" "}
              <span className="optional">(optional)</span>
              <textarea
                maxLength={2000}
                value={draft.history}
                onChange={(e) => update("history", e.target.value)}
                placeholder="For example, a known allergy or a long-term condition"
              />
            </label>
            <label className="field-label">
              Current medicines <span className="optional">(optional)</span>
              <input
                maxLength={500}
                value={draft.medicines}
                onChange={(e) => update("medicines", e.target.value)}
                placeholder="Include anything you think is relevant"
              />
            </label>
          </QuestionCard>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="flow-actions">
          <Button
            variant="outline"
            onClick={() =>
              step === 2 ? setStep(1) : window.location.assign("#/dashboard")
            }
          >
            <ArrowLeft size={16} /> Back
          </Button>
          <Button type="submit">
            Continue <ArrowRight size={16} />
          </Button>
        </div>
      </form>
      <p className="flow-footnote">
        This form is not monitored for emergencies. If you need urgent help,
        contact local emergency services.
      </p>
    </main>
  );
}
