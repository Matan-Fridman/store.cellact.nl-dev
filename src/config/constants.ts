/**
 * Dev vs prod: set VITE_USE_PRODUCTION_URLS=true for production builds.
 * "Dev" URLs here point at staging (arnacon-staging-production), not legacy arnacon-nl.
 * In development you can override with the in-app toggle (stored in localStorage).
 */

const DEV_URLS = {
  /** Public chain-activate function (action: activate from /claim). */
  API_URL:
    "https://europe-west1-arnacon-staging-production.cloudfunctions.net/secnum-chain-activate",
  /** Stripe checkout session creator (payment-link-generator on staging). */
  STRIPE_URL:
    "https://europe-west1-arnacon-staging-production.cloudfunctions.net/payment-link-generator",
  /**
   * Base URL for polling — app calls `{base}/order-result`.
   */
  ORDER_RESULT_URL:
    "https://europe-west1-arnacon-staging-production.cloudfunctions.net/secnum-order-result",
};

const PROD_URLS = {
  /** Public chain-activate function (`action: activate` from /claim). */
  API_URL:
    import.meta.env.VITE_PROD_CHAIN_ACTIVATE_URL ??
    import.meta.env.VITE_PROD_API_URL ??
    "https://europe-west1-arnacon-production-gcp.cloudfunctions.net/secnum-chain-activate",
  /** Stripe checkout session creator (production payment-link-generator). */
  STRIPE_URL:
    import.meta.env.VITE_PROD_STRIPE_URL ??
    "https://europe-west1-arnacon-production-gcp.cloudfunctions.net/payment-link-generator",
  /** Base URL for order-result polling. */
  ORDER_RESULT_URL:
    import.meta.env.VITE_PROD_ORDER_RESULT_URL ??
    "https://europe-west1-arnacon-production-gcp.cloudfunctions.net/secnum-order-result",
};

export function getUseProduction(): boolean {
  // Only dev/staging when explicitly requested via URL param (?dev=true).
  // Everything else — including no param at all — uses production.
  if (typeof window !== "undefined") {
    const dev = new URLSearchParams(window.location.search).get("dev");
    if (dev === "true") return false;
  }
  return true;
}

export function getApiConfig() {
  return getUseProduction() ? PROD_URLS : DEV_URLS;
}


/** Stripe / product metadata */
export const PACKAGE_ID = "secnum_number";
export const PACKAGE_NAME = "Israeli Mobile Number";

/** Pricing (decimal strings — the GCP function multiplies by 100 internally) */
export const PRICE_DISPLAY_AMOUNT = "3.99";  // one-time setup fee
export const SUBSCRIPTION_PRICE   = "4.99";  // monthly subscription
export const PRICE_CURRENCY = "eur";
/** Display-only price shown in CTAs (monthly subscription) */
export const PRICE_DISPLAY = "€4.99 / month";
