/**
 * Firebase initialisation + App Check.
 *
 * One Firebase project per deployment — set VITE_FIREBASE_* in your
 * Vercel environment variables to point at staging or production.
 *
 * Firestore security rule:
 *   match /incomingOrders/{docId} {
 *     allow read: if true;
 *     allow write: if false;
 *   }
 */

import { initializeApp, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function getOrInitApp(config: typeof firebaseConfig, name: string): FirebaseApp {
  try {
    return getApp(name);
  } catch {
    return initializeApp(config, name);
  }
}

const app = getOrInitApp(firebaseConfig, "default");

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
if (siteKey) {
  if (import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG === "true") {
    // @ts-expect-error — official debug flag documented by Firebase
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else {
  console.warn("[firebase] VITE_RECAPTCHA_SITE_KEY not set — App Check disabled.");
}

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) _db = getFirestore(app);
  return _db;
}

/** No-op kept for backwards compatibility with main.tsx import. */
export function initAppCheck(): void {}
