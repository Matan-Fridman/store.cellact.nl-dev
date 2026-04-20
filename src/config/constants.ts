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
  if (import.meta.env.VITE_USE_PRODUCTION_URLS === "true") return true;
  // URL param set by the purchase flow takes priority over localStorage
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const dev = params.get("dev");
    if (dev === "false") return true;
    if (dev === "true") return false;
  }
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("secnum_use_production") === "true";
  }
  return false;
}

export function getApiConfig() {
  return getUseProduction() ? PROD_URLS : DEV_URLS;
}

export function getUseProductionUrls(): boolean {
  return getUseProduction();
}

/** Call after toggling dev/prod in the UI so the next API call uses the new URLs. */
export function setUseProductionUrls(useProd: boolean): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("secnum_use_production", useProd ? "true" : "false");
  }
}

/** Stripe / product metadata */
export const PACKAGE_ID = "secnum_number";
export const PACKAGE_NAME = "Israeli Mobile Number";

/** Pricing (decimal strings — the GCP function multiplies by 100 internally) */
export const PRICE_DISPLAY_AMOUNT = "0.5";
export const SUBSCRIPTION_PRICE = "0.5";
export const PRICE_CURRENCY = "eur";
export const PRICE_DISPLAY = `€${PRICE_DISPLAY_AMOUNT}`;
