import { useCallback, useEffect, useState } from "react";
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
  submissionId: crypto.randomUUID(),
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
  const [savedReview, setSavedReview] = useState(null);
  const { user, demo, leaveSession } = useAuth();
  function updateDraft(value) {
    setSavedReview(null);
    setSubmitted(false);
    setConsultationId("");
    setAppointment(null);
    setDraft(value);
  }
  async function submitConsultation() {
    if (user) {
      const consultation = await createConsultation(draft);
      setConsultationId(consultation.id);
      setSavedReview(consultation);
      setSubmitted(true);
      await Promise.all(
        draft.photos.map((photo) =>
          uploadConsultationImage(consultation.id, photo),
        ),
      );
      const failures = uploads.filter((result) => result.status === "rejected");
      if (failures.length) {
        throw new Error(
          `Your consultation was saved, but ${failures.length} ${failures.length === 1 ? "image" : "images"} could not be uploaded. Try submitting again; saved images will not be duplicated.`,
        );
      }
    }
    setSubmitted(true);
    setAppointment(null);
    if (demo) window.location.hash = "/appointment";
  }

  const refreshPatientData = useCallback(async () => {
    if (!user || demo) return;
    setPatientDataLoading(true);
    setPatientDataError("");
    try {
      const consultation = await getLatestConsultation();
      if (!consultation) {
        setSubmitted(false);
        setConsultationId("");
        setAppointment(null);
        return;
      }
      setAppointment(consultation.appointment);
      setConsultationId(consultation.id);
      setSubmitted(true);
      setDraft({
        submissionId: consultation.submission_id || crypto.randomUUID(),
        symptoms: consultation.symptoms,
        duration: consultation.duration,
        impact: consultation.impact,
        history: consultation.history,
        medicines: consultation.medicines,
        notes: consultation.notes,
        photos: [],
      });
    } catch (error) {
      setPatientDataError(error.message);
    } finally {
      setPatientDataLoading(false);
    }
  }, [user, demo]);
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
      setSavedReview(null);
      setAppointment(null);
      setPatientDataError("");
      setPatientDataLoading(false);
    }
  }, [user, demo]);
  useEffect(() => {
    if (!user || demo) return;
    getLatestConsultation()
      .then((consultation) => {
        if (!consultation) return;
        setConsultationId(consultation.id);
        setSavedReview(consultation);
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
  if (protectedPage && !user && !demo)
    page = (
      <LoginPage key={path} role={path === "/admin" ? "admin" : "patient"} />
    );
  else if (path === "/admin" && user?.role !== "admin")
    page = (
      <main className="flow-container">
        <h1>Administrator access required.</h1>
        <p className="page-intro">
          Sign in with an administrator account to review consultations. Your
          current account is a patient account.
        </p>
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
  else if (["/login", "/login/patient", "/login/admin"].includes(path))
    page = (
      <LoginPage
        key={path}
        role={path === "/login/admin" ? "admin" : "patient"}
      />
    );
  else if (path === "/register") page = <RegisterPage />;
  else if (path === "/dashboard")
    page = (
      <PatientDashboard
        draft={draft}
        submitted={submitted}
        demo={demo}
        appointment={appointment}
        loading={patientDataLoading}
        error={patientDataError}
      />
    );
  else if (path === "/consultation")
    page = <PreConsultation draft={draft} setDraft={updateDraft} />;
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
    page = <UploadSymptoms draft={draft} setDraft={updateDraft} />;
  else if (path === "/review")
    page = (
      <ReviewPage
        draft={draft}
        demo={demo}
        savedReview={savedReview}
        onSummaryUpdate={(result) => setSavedReview(previous => ({ ...previous, ...result }))}
        onSubmit={submitConsultation}
      />
    );
  else if (path === "/appointment" && submitted)
    page = (
      <AppointmentPage
        demo={demo}
        consultationId={consultationId}
        existingAppointment={appointment}
        onAppointmentBooked={setAppointment}
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
          Signed-in users can persist a prototype appointment booking, but the
          app is not connected to a hospital scheduling system and provides no
          medical advice.
        </p>
        <p>
          Google sign-in is not enabled. Production privacy, retention, consent,
          auditing and deletion controls must be defined before real patient
          information is collected.
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
