import { getAuthToken } from "./firebase.js";

const configuredBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
 const token = await getAuthToken();

console.log(
  "[API] Firebase user:",
  token ? "TOKEN PRESENT" : "NO TOKEN"
);
  const response = await fetch(`${configuredBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const payload = await response.json();
      message = payload.details || payload.error || message;
    } catch {}

    if (response.status === 401) {
      message = "Your session has expired. Please sign in again.";
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}