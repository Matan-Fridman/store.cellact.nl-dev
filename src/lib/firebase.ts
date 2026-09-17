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
import { isProductionGcp } from "../config/constants";

const STAGING_FIREBASE = {
  apiKey: "AIzaSyDchYNakninaQPSYLlkQTFqq3a0JJz4_mY",
  authDomain: "arnacon-staging-production.firebaseapp.com",
  projectId: "arnacon-staging-production",
  storageBucket: "arnacon-staging-production.firebasestorage.app",
  messagingSenderId: "200686713833",
  appId: "1:200686713833:web:cf237e014fae20142ea978",
  measurementId: "G-R6EPHDT45P",
};

const PRODUCTION_FIREBASE = {
  apiKey: "AIzaSyBlEdi5DOuWYEPMNMJZZULvHHa_TQ0qqiU",
  authDomain: "arnacon-production-gcp.firebaseapp.com",
  projectId: "arnacon-production-gcp",
  storageBucket: "arnacon-production-gcp.firebasestorage.app",
  messagingSenderId: "343948402138",
  appId: "1:343948402138:web:3cfc2ebdd421e803dbb4e3",
  measurementId: undefined as string | undefined,
};

function firebaseConfig() {
  const fromEnv = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
  };
  if (fromEnv.projectId) return fromEnv;
  if (isProductionGcp()) return PRODUCTION_FIREBASE;
  return STAGING_FIREBASE;
}

const config = firebaseConfig();

function getOrInitApp(name: string): FirebaseApp {
  try {
    return getApp(name);
  } catch {
    return initializeApp(
      {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
        measurementId: config.measurementId,
      },
      name,
    );
  }
}

export function hasFirebaseProject(): boolean {
  return Boolean(config.projectId);
}

const app = getOrInitApp("default");

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
