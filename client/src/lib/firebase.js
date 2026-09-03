import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, signInAnonymously, } from "firebase/auth";
import { apiRequest } from "./api.js";
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const required = [
    ["VITE_FIREBASE_API_KEY", firebaseConfig.apiKey],
    ["VITE_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
    ["VITE_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
    ["VITE_FIREBASE_APP_ID", firebaseConfig.appId],
];
const missing = required.filter(([, value]) => !value).map(([name]) => name);
if (missing.length) {
    console.warn(`[Firebase] Missing client config: ${missing.join(", ")}`);
}
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
export async function getAuthToken(forceRefresh = false) {
    if (!auth.currentUser) {
        throw new Error("You must be signed in to continue.");
    }
    return auth.currentUser.getIdToken(forceRefresh);
}
export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}
export async function loginWithEmail(email, pass) {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
}
export async function registerWithEmail(email, pass) {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
}
export async function continueAsGuest() {
    const result = await signInAnonymously(auth);
    return result.user;
}
export async function logOut() {
    await fbSignOut(auth);
}
export function subscribeToAuth(callback) {
    return onAuthStateChanged(auth, (user) => {
        if (user) {
            callback({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName ||
                    (user.isAnonymous ? "Guest Explorer" : user.email?.split("@")[0] || "Reflective Mind"),
                photoURL: user.photoURL,
                isAnonymous: user.isAnonymous,
            });
        }
        else {
            callback(null);
        }
    });
}
// Server-backed data layer. Firestore is intentionally NOT accessed from the browser.
export function subscribeToUserEntries(userId, onUpdate, onError) {
    if (!userId)
        return () => { };
    let stopped = false;
    let loading = false;
    const load = async () => {
        if (stopped || loading)
            return;
        loading = true;
        try {
            const data = await apiRequest("/api/entries");
            if (!stopped)
                onUpdate(data.entries || []);
        }
        catch (error) {
            if (!stopped) {
                console.error("[API entries error]", error);
                if (onError)
                    onError(error);
            }
        }
        finally {
            loading = false;
        }
    };
    load();
    const interval = window.setInterval(load, 5000);
    return () => {
        stopped = true;
        window.clearInterval(interval);
    };
}
export async function saveJournalEntry(userId, entry) {
    if (!userId)
        throw new Error("User ID is required for database persistence.");
    const entryId = entry.id || `entry-${Date.now()}`;
    const payload = {
        ...entry,
        id: entryId,
        userId,
        updatedAt: Date.now(),
        createdAt: entry.createdAt || Date.now(),
    };
    const data = await apiRequest(`/api/entries/${encodeURIComponent(entryId)}`, {
        method: "PUT",
        body: payload,
    });
    return data.entry;
}
export async function deleteJournalEntry(userId, entryId) {
    if (!userId || !entryId)
        return;
    await apiRequest(`/api/entries/${encodeURIComponent(entryId)}`, { method: "DELETE" });
}
export async function toggleFavoriteEntry(userId, entryId) {
    if (!userId || !entryId)
        return;
    const data = await apiRequest(`/api/entries/${encodeURIComponent(entryId)}/favorite`, {
        method: "PATCH",
    });
    return data.entry;
}
export async function updateEntryTitle(userId, entryId, title) {
    if (!userId || !entryId)
        return;
    const data = await apiRequest(`/api/entries/${encodeURIComponent(entryId)}/title`, {
        method: "PATCH",
        body: { title: title.trim() },
    });
    return data.entry;
}
