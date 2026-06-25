/**
 * Firebase initialisation + App Check.
 *
 * Required env vars:
 *   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
 *   VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID,
 *   VITE_FIREBASE_APP_ID, VITE_FIREBASE_MEASUREMENT_ID,
 *   VITE_RECAPTCHA_SITE_KEY  ← reCAPTCHA v3 site key for App Check
 *
 * Firestore security rule:
 *   match /qrLoginSessions/{sessionId} {
 *     allow read:  if request.app.verified;
 *     allow write: if false;
 *   }
 */

import { initializeApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ─── Config ───────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ─── Initialise eagerly at module load time ───────────────────────────────────
// App Check MUST be attached to the app before any Firestore call is made.
// Doing it at the top level guarantees ordering regardless of call sites.

const app = initializeApp(firebaseConfig);

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

if (siteKey) {
  // Allow local dev to bypass reCAPTCHA using the Firebase debug token flow.
  // Set VITE_FIREBASE_APPCHECK_DEBUG=true and copy the token printed to the
  // console into Firebase Console → App Check → Manage debug tokens.
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

// ─── Exports ──────────────────────────────────────────────────────────────────

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) _db = getFirestore(app);
  return _db;
}

/** No-op kept for backwards compatibility with main.tsx import. */
export function initAppCheck(): void {}
