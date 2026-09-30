import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
export default function LoginPage({ role = "patient" }) {
  const { signInWithPassword, startDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signInWithPassword(email, password);
      window.location.hash = role === "admin" ? "/admin" : "/dashboard";
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-layout container">
      <section className="login-story">
        <span className="eyebrow plain">WELCOME TO A LITTLE LESS WAITING</span>
        <h1>
          Your next step
          <br />
          to <span className="text-blue">better care.</span>
        </h1>
        <p>
          Prepare for your hospital visit from the comfort of your home. We’ll
          help you get the details in order.
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
      <section className="login-card">
        <a className="back-link" href="#/">
          <ArrowLeft size={16} /> Back to home
        </a>
        <h2>Welcome to MediQueue</h2>
        <p className="muted">
          {role === "admin" ? "Log in as Admin" : "Log in as Patient"}
        </p>
        <div className="login-role-options" aria-label="Login options">
          <a
            href="#/login/patient"
            aria-current={role === "patient" ? "page" : undefined}
          >
            Patient
          </a>
          <a
            href="#/login/admin"
            aria-current={role === "admin" ? "page" : undefined}
          >
            Admin
          </a>
        </div>
        {role === "admin" && (
          <p className="login-small">
            Use your authorised admin account to continue.
          </p>
        )}
        <form className="login-fields" onSubmit={handleSubmit}>
          <label className="register-field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="register-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              minLength={6}
              required
            />
          </label>
          <button
            className="button button-primary login-submit"
            type="submit"
            disabled={busy}
          >
            Sign in
          </button>
        </form>
        {busy && <p role="status">Signing you in…</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {role === "patient" && (
          <>
            <div className="divider">
              <span>Just taking a look?</span>
            </div>
            <Button variant="outline" onClick={startDemo}>
              Explore the patient demo <ArrowRight size={17} />
            </Button>
            <p className="login-small">
              No account needed. Use sample information only.
              <br />
              <a href="#/privacy">Read about this prototype’s privacy</a>
            </p>
            <p className="login-small register-linkline">
              New to MediQueue? <a href="#/register">Create an account</a>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
