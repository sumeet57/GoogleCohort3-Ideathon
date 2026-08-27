import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInAnonymously,
  type User
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import type { JournalEntry, UserProfile } from "../types";
import firebaseConfigJson from "../../firebase-applet-config.json";

// Safe initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Strict undefined-stripping utility (Zero-Crash Payload Hygiene)
export function sanitizeFirestorePayload<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

export async function continueAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || (user.isAnonymous ? "Guest Explorer" : user.email?.split("@")[0] || "Reflective Mind"),
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
      });
    } else {
      callback(null);
    }
  });
}

// Database Helpers - Strict User Isolation: /users/{userId}/entries/{entryId}
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId) return () => {};

  const entriesRef = collection(db, "users", userId, "entries");
  const q = query(entriesRef, orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JournalEntry;
        entries.push({
          ...data,
          id: docSnap.id,
        });
      });
      onUpdate(entries);
    },
    (error) => {
      console.error("[Firestore subscribe error]", error);
      if (onError) onError(error);
    }
  );
}

export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error("User ID is required for database persistence.");
  
  const entryId = entry.id || doc(collection(db, "users", userId, "entries")).id;
  const docRef = doc(db, "users", userId, "entries", entryId);
  
  const payload: JournalEntry = {
    ...entry,
    id: entryId,
    userId,
    updatedAt: Date.now(),
    createdAt: entry.createdAt || Date.now(),
  };

  const cleanPayload = sanitizeFirestorePayload(payload);
  await setDoc(docRef, cleanPayload, { merge: true });
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const docRef = doc(db, "users", userId, "entries", entryId);
  await deleteDoc(docRef);
}

export async function toggleFavoriteEntry(userId: string, entryId: string, isFavorite: boolean): Promise<void> {
  if (!userId || !entryId) return;
  const docRef = doc(db, "users", userId, "entries", entryId);
  await updateDoc(docRef, { isFavorite: !isFavorite, updatedAt: Date.now() });
}

export async function updateEntryTitle(userId: string, entryId: string, title: string): Promise<void> {
  if (!userId || !entryId) return;
  const docRef = doc(db, "users", userId, "entries", entryId);
  await updateDoc(docRef, { title: title.trim(), updatedAt: Date.now() });
}
