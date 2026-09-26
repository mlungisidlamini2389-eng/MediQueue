const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

// The server must validate the Google ID token and issue an HttpOnly session cookie.
export async function signInWithGoogle(credential) {
  const response = await fetch(`${baseUrl}/auth/google`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error("We could not sign you in. Please try again.");
  const data = await response.json();
  if (!data.user?.name) throw new Error("The sign-in response was incomplete.");
  return data.user;
}
