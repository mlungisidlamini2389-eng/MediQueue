const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function requestJson(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401)
      throw new Error(data?.detail || "Please sign in to continue.");
    throw new Error(data?.detail || "The request could not be completed.");
  }
  return response.status === 204 ? null : response.json();
}

export async function signInWithPassword(email, password) {
  const data = await requestJson("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!data.user?.name) throw new Error("The sign-in response was incomplete.");
  return data.user;
}

export async function signInAsAdmin(password) {
  const data = await requestJson("/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  if (!data.user?.name) throw new Error("The sign-in response was incomplete.");
  return data.user;
}

export async function registerUser(name, email, password) {
  const data = await requestJson("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  if (!data.user?.name)
    throw new Error("The registration response was incomplete.");
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
    body: JSON.stringify({
      submission_id: draft.submissionId,
      symptoms: draft.symptoms,
      duration: draft.duration,
      impact: draft.impact,
      history: draft.history,
      medicines: draft.medicines,
      notes: draft.notes,
    }),
  });
}

export async function uploadConsultationImage(consultationId, file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch(
    `${baseUrl}/consultations/${consultationId}/images`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
      signal: AbortSignal.timeout(15000),
    },
  );
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

export async function selectAppointmentOffer(offerId) {
  return requestJson(`/appointments/offers/${offerId}/select`, {
    method: "POST",
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
