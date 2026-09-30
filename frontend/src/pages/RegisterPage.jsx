import { ArrowLeft, HeartHandshake, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const [fields, setFields] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [error, setError] = useState("");
  const update = (key, value) =>
    setFields((previous) => ({ ...previous, [key]: value }));
  const [busy, setBusy] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (fields.password.length < 6)
      return setError("Your password must be at least 6 characters.");
    if (fields.password !== fields.confirmPassword)
      return setError("Your passwords do not match.");
    if (!fields.terms)
      return setError("Agree to the terms and privacy information to continue.");
    setBusy(true);
    setError("");
    try {
      await registerUser({
        name: fields.name,
        email: fields.email,
        mobile: fields.mobile,
        password: fields.password,
      });
      window.location.hash = "/dashboard";
    } catch (registrationError) {
      setError(registrationError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-layout register-layout container">
      <section className="login-story">
        <span className="eyebrow plain">A CALMER WAY TO PREPARE FOR CARE</span>
        <h1>
          Care starts with
          <br />
          a <span className="text-blue">clearer first step.</span>
        </h1>
        <p>
          Create your MediQueue account to keep your visit details together and
          feel more prepared for what comes next.
        </p>
        <div className="login-illustration">
          <HeartHandshake size={88} strokeWidth={1.2} />
          <span className="login-orbit" />
        </div>
        <div className="inline-note">
          <ShieldCheck size={20} /> Your care remains in the hands of healthcare
          professionals.
        </div>
      </section>
      <form className="login-card register-card" onSubmit={handleSubmit}>
        <a className="back-link" href="#/">
          <ArrowLeft size={16} /> Back to home
        </a>
        <h2>Create your account</h2>
        <p className="muted">A few details to get your account ready.</p>
        <div className="register-fields">
          <label className="register-field">
            <span>Full name</span>
            <input type="text" name="fullName" autoComplete="name" placeholder="Your full name" value={fields.name} onChange={(event) => update("name", event.target.value)} required />
          </label>
          <label className="register-field">
            <span>Email address</span>
            <input type="email" name="email" autoComplete="email" placeholder="you@example.com" value={fields.email} onChange={(event) => update("email", event.target.value)} required />
          </label>
          <label className="register-field">
            <span>Mobile number</span>
            <input
              type="tel"
              name="mobileNumber"
              autoComplete="tel"
              placeholder="Your mobile number"
              value={fields.mobile}
              onChange={(event) => update("mobile", event.target.value)}
              required
            />
          </label>
          <label className="register-field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="new-password" placeholder="Create a password" value={fields.password} onChange={(event) => update("password", event.target.value)} minLength={6} required />
          </label>
          <label className="register-field">
            <span>Confirm password</span>
            <input type="password" name="confirmPassword" autoComplete="new-password" placeholder="Enter your password again" value={fields.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} minLength={6} required />
          </label>
        </div>
        <label className="register-consent">
          <input type="checkbox" name="terms" checked={fields.terms} onChange={(event) => update("terms", event.target.checked)} />
          <span>
            I agree to the <a href="#/privacy">terms and privacy information</a>.
          </span>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button button-primary register-submit" type="submit" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>
        <p className="register-signin">
          Already have an account? <a href="#/login">Sign in</a>
        </p>
      </form>
    </main>
  );
}
