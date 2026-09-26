import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
export default function LoginPage() {
  const { googleSignIn, startDemo } = useAuth();
  const target = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  useEffect(() => {
    if (!clientId) return;
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
            if (active) window.location.hash = "/dashboard";
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
  }, [clientId]);
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
        <p className="muted">One account. A simpler way to prepare for care.</p>
        <div className="google-area" aria-busy={busy}>
          <div ref={target} />
          {!clientId && (
            <>
              <button className="google-placeholder" disabled>
                <span className="google-g">G</span> Continue with Google
              </button>
              <p className="setup-note">
                Google sign-in will be available when the service is connected.
                You can explore the demo below.
              </p>
            </>
          )}
          {clientId && !ready && !error && (
            <p role="status">Loading Google sign-in…</p>
          )}
          {busy && <p role="status">Signing you in…</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <p className="login-small">
          We use Google for sign-in, so there’s no extra password to remember.
        </p>
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
      </section>
    </main>
  );
}
