export const API_URL =
  "https://insert-commitment-esimera-309305771885.europe-west1.run.app";

export const STRIPE_URL =
  "https://us-central1-arnacon-nl.cloudfunctions.net/send_stripe";

/** Webhook base URL: success page fetches GET /order-result?session_id= for claimUrl (must allow CORS). */
export const ORDER_RESULT_URL =
  import.meta.env.VITE_ORDER_RESULT_URL ||
  "https://us-central1-arnacon-nl.cloudfunctions.net/stripe-webhook";

/** Stripe / product metadata */
export const PACKAGE_ID = "secnum_number";
export const PACKAGE_NAME = "Israeli Mobile Number";

/** Pricing (decimal strings — the GCP function multiplies by 100 internally) */
export const PRICE_DISPLAY_AMOUNT = "49";   // one-time setup fee, e.g. ₪49
export const SUBSCRIPTION_PRICE = "10";      // "0" = one-time only; set to e.g. "29" for monthly
export const PRICE_CURRENCY = "ILS";
export const PRICE_DISPLAY = `₪${PRICE_DISPLAY_AMOUNT}`;
