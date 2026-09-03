import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from './config.js';

const app = getApps().length ? getApps()[0] : initializeApp({
  projectId: config.GOOGLE_CLOUD_PROJECT
});

export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
firestore.settings({ ignoreUndefinedProperties: false });
