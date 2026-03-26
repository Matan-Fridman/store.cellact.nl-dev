/**
 * Dev vs prod: set VITE_USE_PRODUCTION_URLS=true for production builds.
 * In development you can override with the in-app toggle (stored in localStorage).
 */

const DEV_URLS = {
  /** Blockchain CF (`purchase` / `expire` / `activate`) */
  API_URL:
    "https://europe-west1-arnacon-nl.cloudfunctions.net/secnum-blockchain-api",
  STRIPE_URL: "https://us-central1-arnacon-nl.cloudfunctions.net/send_stripe",
  /**
   * Base URL for polling — app calls `{base}/order-result`.
   * Use the payment **handler** directly, or the **Stripe adapter** base if it proxies to HANDLER_URL.
   */
  ORDER_RESULT_URL:
    "https://europe-west1-arnacon-nl.cloudfunctions.net/secnum-payment-handler",
};

const PROD_URLS = {
  API_URL: import.meta.env.VITE_PROD_API_URL ?? DEV_URLS.API_URL,
  STRIPE_URL: import.meta.env.VITE_PROD_STRIPE_URL ?? DEV_URLS.STRIPE_URL,
  ORDER_RESULT_URL:
    import.meta.env.VITE_PROD_ORDER_RESULT_URL ?? DEV_URLS.ORDER_RESULT_URL,
};

function getUseProduction(): boolean {
  if (import.meta.env.VITE_USE_PRODUCTION_URLS === "true") return true;
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
export const PRICE_DISPLAY_AMOUNT = "49";
export const SUBSCRIPTION_PRICE = "10";
export const PRICE_CURRENCY = "ILS";
export const PRICE_DISPLAY = `₪${PRICE_DISPLAY_AMOUNT}`;
