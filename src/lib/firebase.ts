/**
 * Firebase initialisation + App Check.
 *
 * Two Firebase projects are supported — staging and production.
 * getDb() returns the Firestore instance for the active environment
 * (determined by getUseProduction() at call time).
 *
 * Staging env vars:   VITE_FIREBASE_*
 * Production env vars: VITE_FIREBASE_PROD_*
 *
 * Firestore security rule (both projects):
 *   match /incomingOrders/{docId} {
 *     allow read: if true;
 *     allow write: if false;
 *   }
 */

import { initializeApp, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getUseProduction } from "../config/constants";

// ─── Configs ──────────────────────────────────────────────────────────────────

const stagingConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const prodConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_PROD_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_PROD_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROD_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_PROD_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_PROD_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_PROD_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_PROD_MEASUREMENT_ID,
};

// ─── App initialisation ───────────────────────────────────────────────────────

function getOrInitApp(config: typeof stagingConfig, name: string): FirebaseApp {
  try {
    return getApp(name);
  } catch {
    return initializeApp(config, name);
  }
}

const stagingApp = getOrInitApp(stagingConfig, "staging");
const prodApp    = prodConfig.apiKey ? getOrInitApp(prodConfig, "prod") : stagingApp;

// App Check on staging app
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
if (siteKey) {
  if (import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG === "true") {
    // @ts-expect-error — official debug flag documented by Firebase
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(stagingApp, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else {
  console.warn("[firebase] VITE_RECAPTCHA_SITE_KEY not set — App Check disabled.");
}

// ─── Exports ──────────────────────────────────────────────────────────────────

let _stagingDb: Firestore | null = null;
let _prodDb:    Firestore | null = null;

export function getDb(): Firestore {
  if (getUseProduction()) {
    if (!_prodDb) _prodDb = getFirestore(prodApp);
    return _prodDb;
  }
  if (!_stagingDb) _stagingDb = getFirestore(stagingApp);
  return _stagingDb;
}

/** No-op kept for backwards compatibility with main.tsx import. */
export function initAppCheck(): void {}
