const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function requestJson(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    signal: options?.signal || AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((issue) => issue.msg).join(" ")
      : data?.detail;
    if (response.status === 401)
      throw new Error(detail || "Please sign in to continue.");
    throw new Error(detail || "The request could not be completed.");
  }
  return response.status === 204 ? null : response.json();
}

export async function signInAsAdmin(password) {
  const data = await requestJson("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  if (!data.user?.name || data.user.role !== "admin") throw new Error("Administrator access required.");
  return data.user;
}

export async function signInWithPassword(email, password) {
  const data = await requestJson("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!data.user?.name) throw new Error("The sign-in response was incomplete.");
  return data.user;
}

export async function registerUser(name, email, password, mobile) {
  const data = await requestJson("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, mobile }),
  });
  if (!data.user?.name) throw new Error("The registration response was incomplete.");
  return data.user;
}

export async function signOut() {
  await requestJson("/auth/logout", { method: "POST" });
}

export async function getCurrentUser() {
  const data = await requestJson("/auth/me", { method: "GET" });
  if (!data.user?.name) throw new Error("The session response was incomplete.");
  return data.user;
}

export async function createConsultation(draft) {
  return requestJson("/consultations", {
    method: "POST",
    signal: AbortSignal.timeout(240000),
    body: JSON.stringify({
      symptoms: draft.symptoms,
      duration: draft.duration,
      impact: draft.impact,
      history: draft.history,
      medicines: draft.medicines,
      notes: draft.notes,
    }),
  });
}

export async function previewConsultationSummary(draft, signal) {
  return requestJson("/consultations/summary", {
    method: "POST",
    body: JSON.stringify({
      symptoms: draft.symptoms,
      duration: draft.duration,
      impact: draft.impact,
      history: draft.history,
      medicines: draft.medicines,
      notes: draft.notes,
    }),
    signal,
  });
}

export async function uploadConsultationImage(consultationId, file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch(`${baseUrl}/consultations/${consultationId}/images`, {
    method: "POST",
    credentials: "include",
    body: formData,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "The image could not be uploaded.");
  }
  return response.json();
}

export async function getAppointmentAvailability() {
  return requestJson("/appointments/availability", { method: "GET" });
}

export async function bookAppointment(consultationId, slotId) {
  return requestJson("/appointments", {
    method: "POST",
    body: JSON.stringify({ consultation_id: consultationId, slot_id: slotId }),
  });
}

export async function getAppointmentOffers(consultationId) {
  return requestJson(
    `/appointments/offers?consultation_id=${encodeURIComponent(consultationId)}`,
    { method: "GET" },
  );
}

export async function getLatestConsultation() {
  return requestJson("/consultations/mine/latest", { method: "GET" });
}

export async function selectAppointmentOffer(offerId, mobile) {
  return requestJson(`/appointments/offers/${offerId}/select`, {
    method: "POST",
    body: JSON.stringify({ mobile }),
    signal: AbortSignal.timeout(60000),
  });
}

export async function getAdminConsultations() {
  return requestJson("/admin/consultations", { method: "GET" });
}

export async function offerAppointmentDates(consultationId, offers) {
  return requestJson(`/admin/consultations/${consultationId}/offers`, {
    method: "POST",
    body: JSON.stringify({ offers }),
  });
}

// The server must validate the Google ID token and issue an HttpOnly session cookie.
export async function signInWithGoogle(credential) {
  const data = await requestJson("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  if (!data.user?.name) throw new Error("The sign-in response was incomplete.");
  return data.user;
}

export async function retryConsultationSummary(id) {
  return requestJson(`/consultations/${id}/summary`, { method: "POST", signal: AbortSignal.timeout(240000) });
}
