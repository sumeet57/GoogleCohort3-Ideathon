import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import serviceAccount from "../cohort3-lab2-firebase-adminsdk-fbsvc-585106b56d.json"
  with { type: "json" };

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
    });

export const firebaseAuth = getAuth(app);

// IMPORTANT: your Firestore database is named "testing"
export const firestore = getFirestore(app, "testing");