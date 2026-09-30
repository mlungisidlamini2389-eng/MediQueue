import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PatientDashboard from "./pages/PatientDashboard";
import PreConsultation from "./pages/PreConsultation";
import UploadSymptoms from "./pages/UploadSymptoms";
import ReviewPage from "./pages/ReviewPage";
import AppointmentPage from "./pages/AppointmentPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Button from "./components/Button";
import { useAuth } from "./context/AuthContext";
import {
  createConsultation,
  getLatestConsultation,
  uploadConsultationImage,
} from "./services/api";
const emptyDraft = () => ({
  symptoms: [],
  duration: "",
  impact: "",
  history: "",
  medicines: "",
  notes: "",
  photos: [],
});
export default function App() {
  const [path, setPath] = useState(window.location.hash.slice(1) || "/");
  const [draft, setDraft] = useState(emptyDraft);
  const [submitted, setSubmitted] = useState(false);
  const [consultationId, setConsultationId] = useState("");
  const [appointment, setAppointment] = useState(null);
  const { user, demo, leaveSession } = useAuth();
  async function submitConsultation() {
    if (user) {
      const consultation = await createConsultation(draft);
      setConsultationId(consultation.id);
      await Promise.all(
        draft.photos.map((photo) =>
          uploadConsultationImage(consultation.id, photo),
        ),
      );
    }
    setSubmitted(true);
    setAppointment(null);
    window.location.hash = "/appointment";
  }
  useEffect(() => {
    const change = () => setPath(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (!user && !demo) {
      setDraft(emptyDraft());
      setSubmitted(false);
      setConsultationId("");
      setAppointment(null);
    }
  }, [user, demo]);
  useEffect(() => {
    if (!user || demo) return;
    getLatestConsultation()
      .then((consultation) => {
        if (!consultation) return;
        setConsultationId(consultation.id);
        setSubmitted(true);
        setAppointment(consultation.appointment);
        setDraft({
          symptoms: consultation.symptoms,
          duration: consultation.duration,
          impact: consultation.impact,
          history: consultation.history,
          medicines: consultation.medicines,
          notes: consultation.notes,
          photos: [],
        });
      })
      .catch(() => {});
  }, [user, demo]);
  useEffect(() => {
    const section = document.getElementById(path.slice(1));
    if (section) section.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo(0, 0);
    document.title = `MediQueue — ${{ "/login": "Sign in", "/login/admin": "Admin sign in", "/login/patient": "Patient sign in", "/register": "Create your account", "/dashboard": "Your dashboard", "/consultation": "Pre-consultation", "/upload": "Additional details", "/review": "Review your information", "/appointment": "Appointment options", "/admin": "Consultation review" }[path] || "Your care, with less waiting"}`;
  }, [path]);
  const protectedPage = [
    "/dashboard",
    "/consultation",
    "/upload",
    "/review",
    "/appointment",
    "/admin",
  ].includes(path);
  let page;
  if (protectedPage && !user && !demo) page = <LoginPage key={path} role={path === "/admin" ? "admin" : "patient"} />;
  else if (path === "/admin" && user?.role !== "admin")
    page = (
      <main className="flow-container">
        <h1>Administrator access required.</h1>
        <p className="page-intro">Sign in with an administrator account to review consultations. Your current account is a patient account.</p>
        <Button onClick={leaveSession}>Switch account</Button>
      </main>
    );
  else if (path === "/admin") page = <AdminDashboard />;
  else if (["/", "/how-it-works", "/features", "/healthcare"].includes(path))
    page = (
      <main id="main-content">
        <LandingPage />
      </main>
    );
  else if (["/login", "/login/patient", "/login/admin"].includes(path)) page = <LoginPage key={path} role={path === "/login/admin" ? "admin" : "patient"} />;
  else if (path === "/register") page = <RegisterPage />;
  else if (path === "/dashboard")
    page = <PatientDashboard draft={draft} submitted={submitted} demo={demo} />;
  else if (path === "/consultation")
    page = <PreConsultation draft={draft} setDraft={setDraft} />;
  else if (
    ["/upload", "/review", "/appointment"].includes(path) &&
    (!draft.symptoms.length || !draft.duration || !draft.impact)
  )
    page = (
      <main className="flow-container">
        <h1>Let’s start with your symptoms.</h1>
        <p className="page-intro">
          Complete the first two steps before reviewing your information.
        </p>
        <Button href="#/consultation">Continue pre-consultation</Button>
      </main>
    );
  else if (path === "/upload")
    page = <UploadSymptoms draft={draft} setDraft={setDraft} />;
  else if (path === "/review")
    page = (
      <ReviewPage
        draft={draft}
        onSubmit={submitConsultation}
      />
    );
  else if (path === "/appointment" && submitted)
    page = (
      <AppointmentPage
        demo={demo}
        consultationId={consultationId}
        existingAppointment={appointment}
      />
    );
  else if (path === "/appointment")
    page = (
      <main className="flow-container">
        <h1>Review your details first.</h1>
        <Button href="#/review">Review pre-consultation</Button>
      </main>
    );
  else if (path === "/doctor") page = <DoctorDashboard />;
  else if (path === "/privacy")
    page = (
      <main className="flow-container panel privacy">
        <h1>Your privacy in this prototype</h1>
        <p>
          Demo questionnaire answers and selected images are held only in this
          browser tab’s memory. Signed-in submissions are sent to the MediQueue
          backend so the care team can review them. Use fictional information
          while exploring this prototype.
        </p>
        <p>
          Please use fictional information while exploring. This prototype does
          not book appointments or provide medical advice.
        </p>
        <p>
          If Google sign-in is configured, Google’s sign-in service loads on the
          login page. Its credential is sent to the configured authentication
          API for verification. Production privacy, retention and consent
          controls will be defined before real patient information is collected.
        </p>
        <Button href="#/">Back to home</Button>
      </main>
    );
  else
    page = (
      <main className="flow-container">
        <h1>We couldn’t find that page.</h1>
        <Button href="#/">Back to home</Button>
      </main>
    );
  return (
    <>
      <a
        className="skip-link"
        href="#content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("content").focus();
        }}
      >
        Skip to content
      </a>
      <Navbar path={path} />
      {protectedPage && demo && (
        <div className="demo-banner">
          MVP preview · Use sample information. Appointments and clinical
          services are not connected.
        </div>
      )}
      <div id="content" tabIndex={-1}>
        {page}
      </div>
      <Footer />
    </>
  );
}
