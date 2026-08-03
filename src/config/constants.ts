/**
 * All GCP function URLs are derived from a single base URL.
 * Set VITE_BASE_URL in your Vercel environment (or .env) per deployment:
 *   Staging:    https://europe-west1-arnacon-staging-production.cloudfunctions.net
 *   Production: https://europe-west1-arnacon-production-gcp.cloudfunctions.net
 */

const BASE_URL = (
  import.meta.env.VITE_BASE_URL ??
  "https://europe-west1-arnacon-staging-production.cloudfunctions.net"
).replace(/\/$/, "");

export const URLS = {
  API_URL:               `${BASE_URL}/secnum-chain-activate`,
  ACTIVATE_URL:          `${BASE_URL}/secnum-activate-number`,
  STRIPE_URL:            `${BASE_URL}/payment-link-generator`,
  ORDER_RESULT_URL:      `${BASE_URL}/secnum-order-result`,
  QR_CREATE_SESSION_URL: `${BASE_URL}/qr-login-create-session`,
  QR_CONFIRM_URL:        `${BASE_URL}/qr-login-confirm/confirm`,
  PORT_REQUEST_URL:      `${BASE_URL}/port-number-request`,
};

export function getApiConfig() {
  return URLS;
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
/** Display-only monthly price (short). Full setup+monthly lives in translated finePrint. */
export const PRICE_DISPLAY = "€4.99/mo";
