/**
 * All GCP function URLs are derived from a single base URL per environment.
 *
 * Staging (dev / testnet) — used when the page is loaded with ?dev=true.
 *   Override: VITE_DEV_BASE_URL
 *
 * Production (mainnet) — the default for all normal visits.
 *   Override: VITE_PROD_BASE_URL
 *
 * You only ever need to set one env var per environment, not one per function.
 */

const STAGING_BASE = (
  import.meta.env.VITE_DEV_BASE_URL ??
  "https://europe-west1-arnacon-staging-production.cloudfunctions.net"
).replace(/\/$/, "");

const PROD_BASE = (
  import.meta.env.VITE_PROD_BASE_URL ??
  "https://europe-west1-arnacon-production-gcp.cloudfunctions.net"
).replace(/\/$/, "");

const DEV_URLS = {
  /** Public chain-activate function (action: activate from /claim). */
  API_URL:               `${STAGING_BASE}/secnum-chain-activate`,
  /** Stripe checkout session creator. */
  STRIPE_URL:            `${STAGING_BASE}/payment-link-generator`,
  /** Base URL for order-result polling. */
  ORDER_RESULT_URL:      `${STAGING_BASE}/secnum-order-result`,
  /** QR login — creates a new session, returns { sessionId }. */
  QR_CREATE_SESSION_URL: `${STAGING_BASE}/qr-login-create-session`,
  /** QR login — confirm endpoint embedded in the deeplink for Arnacon to call. */
  QR_CONFIRM_URL:        `${STAGING_BASE}/qr-login-confirm/confirm`,
  /** Number-porting request submission. */
  PORT_REQUEST_URL:      `${STAGING_BASE}/port-number-request`,
};

const PROD_URLS = {
  API_URL:               `${PROD_BASE}/secnum-chain-activate`,
  STRIPE_URL:            `${PROD_BASE}/payment-link-generator`,
  ORDER_RESULT_URL:      `${PROD_BASE}/secnum-order-result`,
  QR_CREATE_SESSION_URL: `${PROD_BASE}/qr-login-create-session`,
  QR_CONFIRM_URL:        `${PROD_BASE}/qr-login-confirm/confirm`,
  PORT_REQUEST_URL:      `${PROD_BASE}/port-number-request`,
};

const DEV_SESSION_KEY = "secnum_dev";

// Eagerly read ?dev=true from the URL as soon as this module loads.
// This runs before any React navigation can strip the param away.
if (typeof window !== "undefined") {
  const _dev = new URLSearchParams(window.location.search).get("dev");
  if (_dev === "true") sessionStorage.setItem(DEV_SESSION_KEY, "true");
  else if (_dev === "false") sessionStorage.removeItem(DEV_SESSION_KEY);
}

export function getUseProduction(): boolean {
  if (typeof window === "undefined") return true;
  const dev = new URLSearchParams(window.location.search).get("dev");
  if (dev === "true") {
    // Persist so navigation to other pages without the param stays in dev.
    sessionStorage.setItem(DEV_SESSION_KEY, "true");
    return false;
  }
  if (dev === "false") {
    sessionStorage.removeItem(DEV_SESSION_KEY);
    return true;
  }
  // No URL param — check if dev was set earlier in this session.
  return sessionStorage.getItem(DEV_SESSION_KEY) !== "true";
}

export function getApiConfig() {
  return getUseProduction() ? PROD_URLS : DEV_URLS;
}


/** Stripe / product metadata */
export const PACKAGE_ID = "secnum_number";
export const PACKAGE_NAME = "Israeli Mobile Number";

/** Port-a-number package */
export const PORT_PACKAGE_ID = "secnum_port_number";
export const PORT_PACKAGE_NAME = "Israeli Number Porting";

/** Pricing (decimal strings — the GCP function multiplies by 100 internally) */
export const PRICE_DISPLAY_AMOUNT = "3.99";  // one-time setup fee
export const SUBSCRIPTION_PRICE   = "4.99";  // monthly subscription
export const PRICE_CURRENCY = "eur";
/** Display-only price shown in CTAs (monthly subscription) */
export const PRICE_DISPLAY = "€4.99 / month";
