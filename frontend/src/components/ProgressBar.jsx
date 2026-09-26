export default function ProgressBar({ step = 1, total = 4 }) {
  return (
    <div className="progress-group">
      <div className="split">
        <span>Pre-consultation</span>
        <span>
          Step {step} of {total}
        </span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Pre-consultation progress"
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <span style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}
