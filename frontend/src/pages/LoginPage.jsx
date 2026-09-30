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
  const { signInWithPassword, signInAsAdmin, googleSignIn, startDemo } = useAuth();
  const target = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (role !== "admin" && (!email.trim() || !email.includes("@"))) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < (role === "admin" ? 1 : 6)) {
      setError(role === "admin" ? "Enter your admin password." : "Your password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (role === "admin") await signInAsAdmin(password);
      else await signInWithPassword(email, password);
      window.location.hash = role === "admin" ? "/admin" : "/dashboard";
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!clientId || role === "admin") return;
    let active = true;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    const timer = setTimeout(() => {
      if (active)
        setError(
          "Google sign-in is taking too long to load. Please refresh and try again.",
        );
    }, 15000);
    script.onload = () => {
      clearTimeout(timer);
      if (!active) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!active) return;
          setBusy(true);
          setError("");
          try {
            await googleSignIn(credential);
            if (active) window.location.hash = role === "admin" ? "/admin" : "/dashboard";
          } catch {
            if (active)
              setError(
                "Sign-in could not be completed. Please check that the authentication service is available and try again.",
              );
          } finally {
            if (active) setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(target.current, {
        theme: "outline",
        size: "large",
        width: 280,
        text: "continue_with",
        shape: "pill",
      });
      setReady(true);
    };
    script.onerror = () => {
      clearTimeout(timer);
      if (active)
        setError(
          "Google sign-in could not load. Check your connection and refresh.",
        );
    };
    document.head.appendChild(script);
    return () => {
      active = false;
      clearTimeout(timer);
      script.remove();
    };
  }, [clientId, role]);
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
        {role === "admin" && <p className="login-small">Enter your admin password to continue.</p>}
        <form className="login-fields" onSubmit={handleSubmit}>
          {role !== "admin" && <label className="register-field">
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
          </label>}
          <label className="register-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              minLength={role === "admin" ? 1 : 6}
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
        {role !== "admin" && <>
        <div className="divider">
          <span>Or continue with</span>
        </div>
        <div className="google-area" aria-busy={busy}>
          <div ref={target} />
          {!clientId && (
            <>
              <button className="google-placeholder" disabled>
                <span className="google-g">G</span> Continue with Google
              </button>
              <p className="setup-note">
                Google sign-in will be available when the service is connected.
                {role === "patient" && "You can explore the demo below."}
              </p>
            </>
          )}
          {clientId && !ready && !error && (
            <p role="status">Loading Google sign-in…</p>
          )}
        </div>
        </>}
        <div aria-live="polite">
          {busy && <p role="status">Signing you in…</p>}
          {error && (
            <p className="error" role="alert">
              {error}
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
