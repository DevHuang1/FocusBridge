import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Firebase Auth/Firestore need browser APIs and throw in a bare Node
// environment. Guard the initialization so importing this module in tests
// (or SSR) is safe; the client app always runs in a browser.
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export const auth: Auth | null = isBrowser ? getAuth(app) : null;
export const db: Firestore | null = isBrowser ? getFirestore(app) : null;

export function getDb(): Firestore {
  if (!db) throw new Error('Firestore is only available in the browser');
  return db;
}

export function getAuthInstance(): Auth {
  if (!auth) throw new Error('Firebase Auth is only available in the browser');
  return auth;
}