/**
 * Firebase initialisation + App Check.
 *
 * Required env vars (add to .env / deployment config):
 *
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_FIREBASE_MEASUREMENT_ID
 *   VITE_RECAPTCHA_SITE_KEY   ← reCAPTCHA v3 site key for App Check
 *
 * App Check enforces that only requests originating from your registered
 * domain are accepted by Firestore. The matching security rule is:
 *
 *   match /qrLoginSessions/{sessionId} {
 *     allow read:  if request.app.verified;   // App Check required
 *     allow write: if false;                  // server-side writes only
 *   }
 *
 * To enable App Check in the Firebase console:
 *   Build → App Check → Apps → Register your web app with reCAPTCHA v3
 *   Then add your domain under "Authorized domains".
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";

// ─── Config from env ──────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ─── Singleton init ───────────────────────────────────────────────────────────

let app: FirebaseApp;
let db: Firestore;
let appCheck: AppCheck | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getApp());
  }
  return db;
}

/**
 * Call once at app startup (e.g. main.tsx) to activate App Check.
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * In development you can bypass App Check by setting:
 *   VITE_FIREBASE_APPCHECK_DEBUG=true
 * which sets the global debug token flag before initialisation.
 */
export function initAppCheck(): void {
  if (appCheck) return;

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  if (!siteKey) {
    console.warn(
      "[firebase] VITE_RECAPTCHA_SITE_KEY not set — App Check disabled. " +
      "Set VITE_FIREBASE_APPCHECK_DEBUG=true for local dev.",
    );
    return;
  }

  // Allow local dev to bypass App Check using the debug token flow
  if (import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG === "true") {
    // @ts-expect-error — official debug flag documented by Firebase
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  appCheck = initializeAppCheck(getApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
