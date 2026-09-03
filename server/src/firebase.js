import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const isCloudRun = Boolean(process.env.K_SERVICE);

let app;

if (getApps().length) {
  app = getApps()[0];
} else if (isCloudRun) {
  // Cloud Run uses its attached service account automatically.
  app = initializeApp();
} else {
  // Local development uses the Firebase Admin service-account JSON.
  const { default: serviceAccount } = await import(
    "../secret-local.json",
    {
      with: { type: "json" },
    }
  );

  app = initializeApp({
    credential: cert(serviceAccount),
  });
}

export const firebaseAuth = getAuth(app);

// IMPORTANT: your Firestore database is named "testing"
export const firestore = getFirestore(app, "testing");