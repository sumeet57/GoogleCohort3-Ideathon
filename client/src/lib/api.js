import { auth, getAuthToken } from "./firebase.js";

const configuredBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function waitForAuthReady() {
  if (auth.currentUser) return auth.currentUser;
  
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function apiRequest(path, options = {}) {
  await waitForAuthReady();

  const token = await getAuthToken(true);

  if (!token) {
    throw new Error("No active authentication token available.");
  }

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