import {
  ArrowRight,
  Play,
  Clock3,
  ClipboardCheck,
  Users,
  Heart,
  FileText,
  Sparkles,
  CalendarDays,
  Hospital,
  ShieldCheck,
  Check,
  ArrowUpRight,
} from "lucide-react";
import Button from "../components/Button";
import AppointmentCard from "../components/AppointmentCard";
import { useAuth } from "../context/AuthContext";
const benefits = [
  [
    Clock3,
    "Less waiting. More living.",
    "Arrive closer to your appointment, not hours before it.",
  ],
  [
    ClipboardCheck,
    "A better prepared care team",
    "Share your concerns before you walk through the door.",
  ],
  [
    Users,
    "More space for everyone",
    "Help make crowded waiting rooms a thing of the past.",
  ],
  [
    Heart,
    "Care that puts you first",
    "A simpler, calmer journey from home to hospital.",
  ],
];
const steps = [
  [
    FileText,
    "Tell us how you feel",
    "Answer a few questions about your symptoms and medical history.",
  ],
  [
    Sparkles,
    "We organise the details",
    "AI helps prepare a clear summary for your healthcare professional.",
  ],
  [
    CalendarDays,
    "Get a time that fits",
    "Your visit is matched to the availability of the healthcare team.",
  ],
  [
    Hospital,
    "Arrive ready for care",
    "Come at your scheduled time. Your care team takes it from here.",
  ],
];
export default function LandingPage({ section }) {
  const { user, demo, startDemo } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="hero-grid container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> A BETTER WAY TO GET CARE
            </div>
            <h1>
              Less time in line.
              <br />
              More time for
              <br />
              <span>your health.</span>
            </h1>
            <p>
              Your care starts before you arrive. Share how you’re feeling,
              prepare for your visit, and take the uncertainty out of waiting.
            </p>
            <div className="hero-buttons">
              <Button href={user || demo ? "#/consultation" : "#/login"}>
                Start pre-consultation <ArrowRight size={19} />
              </Button>
              <a className="watch-link" href="#/how-it-works">
                <span>
                  <Play size={13} fill="currentColor" />
                </span>
                See how it works
              </a>
            </div>
            {!user && !demo && (
              <section className="home-sign-in" aria-label="Sign in">
                <h2>Sign in to MediQueue</h2>
                <div className="login-role-options">
                  <Button href="#/login/patient">Log in as Patient</Button>
                  <Button href="#/login/admin" variant="outline">Log in as Admin</Button>
                </div>
              </section>
            )}
            <div className="hero-reassurance">
              <ShieldCheck size={17} />
              <span>Thoughtfully designed. Always human-led.</span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Preview of the patient questionnaire and appointment"
          >
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <span className="art-plus plus-one">+</span>
            <span className="art-plus plus-two">+</span>
            <div className="floating-label">
              <span className="mini-icon">
                <Clock3 size={18} />
              </span>
              <div>
                <strong>
                  A little planning.
                  <br />A lot less waiting.
                </strong>
              </div>
            </div>
            <div className="phone phone-back">
              <div className="phone-speaker" />
              <div className="phone-inner">
                <div className="phone-title">Your appointment</div>
                <AppointmentCard compact />
              </div>
            </div>
            <div className="phone phone-front">
              <div className="phone-speaker" />
              <div className="phone-inner">
                <div className="phone-brand">
                  <span>✚</span> Medi<span className="text-blue">Queue</span>
                  <span className="phone-menu">☰</span>
                </div>
                <p className="phone-greeting">
                  Good morning,
                  <br />
                  <strong>
                    Sibusiso <span>☀</span>
                  </strong>
                </p>
                <div className="phone-progress">
                  <div className="split">
                    <strong>Let’s get you ready</strong>
                    <span>2 of 4</span>
                  </div>
                  <div className="progress">
                    <span style={{ width: "50%" }} />
                  </div>
                </div>
                <div className="phone-question">
                  <strong>How are you feeling?</strong>
                  <p>Select your main symptoms.</p>
                  {["Fever", "Cough", "Headache", "Stomach pain", "Other"].map(
                    (label) => (
                      <div
                        key={label}
                        className={`phone-option ${label === "Headache" ? "selected" : ""}`}
                      >
                        <span>
                          {label === "Headache" && <Check size={11} />}
                        </span>
                        {label}
                      </div>
                    ),
                  )}
                </div>
                <div className="phone-next">
                  Continue <ArrowRight size={13} />
                </div>
                <div className="phone-private">
                  <ShieldCheck size={10} /> Your information stays yours
                </div>
              </div>
            </div>
            <div className="floating-confirm">
              <span className="check-circle">
                <Check size={17} />
              </span>
              <div>
                <strong>You’re one step closer.</strong>
                <small>To care, without the long queue.</small>
              </div>
            </div>
            <div className="art-caption">
              A preview of a simpler patient journey
            </div>
          </div>
        </div>
      </section>
      <section className="benefits container" id="features" tabIndex={-1}>
        {benefits.map(([Icon, title, text]) => (
          <article className="benefit" key={title}>
            <span className="benefit-icon">
              <Icon size={23} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <section
        className="how-section container"
        id="how-it-works"
        tabIndex={-1}
      >
        <div className="section-top">
          <div>
            <span className="eyebrow plain">
              FROM YOUR HOME TO YOUR CARE TEAM
            </span>
            <h2>A simpler journey, in four steps.</h2>
          </div>
          <p>
            A few minutes now.{" "}
            <br />A smoother hospital visit later.
          </p>
        </div>
        <div className="steps">
          {steps.map(([Icon, title, text], index) => (
            <article key={title} className="step">
              <div className="step-top">
                <span className="step-icon">
                  <Icon size={25} />
                </span>
                <span className="step-number">0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="human-section container"
        id="healthcare"
        tabIndex={-1}
      >
        <div className="human-icon">
          <ShieldCheck size={32} />
        </div>
        <div>
          <span className="eyebrow plain">
            TECHNOLOGY THAT SUPPORTS. PEOPLE WHO CARE.
          </span>
          <h2>AI helps organise. Healthcare professionals decide.</h2>
          <p>
            Your pre-consultation helps your care team understand your concerns.
            Every medical decision stays with a qualified healthcare
            professional.
          </p>
        </div>
        <Button variant="outline" onClick={startDemo}>
          Explore the demo <ArrowUpRight size={17} />
        </Button>
      </section>
    </>
  );
}
