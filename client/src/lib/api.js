import { getAuthToken } from "./firebase.js";
const configuredBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export async function apiRequest(path, options = {}) {
    const token = await getAuthToken();
    const response = await fetch(`${configuredBase}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const payload = await response.json();
            message = payload.details || payload.error || message;
        }
        catch {
            // Keep fallback message.
        }
        if (response.status === 401) {
            message = "Your session has expired. Please sign in again.";
        }
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }
    if (response.status === 204)
        return null;
    return response.json();
}
