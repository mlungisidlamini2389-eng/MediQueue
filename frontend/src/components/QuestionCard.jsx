export default function QuestionCard({ title, description, children }) {
  return (
    <section className="question-card">
      <h2>{title}</h2>
      {description && <p className="muted">{description}</p>}
      <div className="question-body">{children}</div>
    </section>
  );
}
