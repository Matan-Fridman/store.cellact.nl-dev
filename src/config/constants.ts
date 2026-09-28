/**
 * All GCP function URLs are derived from a single base URL.
 * Set VITE_BASE_URL in your Vercel environment (or .env) per deployment:
 *   Staging:    https://europe-west1-arnacon-staging-production.cloudfunctions.net
 *   Production: https://europe-west1-arnacon-production-gcp.cloudfunctions.net
 */

const BASE_URL = (
  import.meta.env.VITE_BASE_URL ??
  (typeof window !== "undefined" && /(?:^|\.)store\.cellact\.nl$/i.test(window.location.hostname)
    ? "https://europe-west1-arnacon-production-gcp.cloudfunctions.net"
    : "https://europe-west1-arnacon-staging-production.cloudfunctions.net")
).replace(/\/$/, "");

export const URLS = {
  API_URL:               `${BASE_URL}/secnum-chain-activate`,
  ACTIVATE_URL:          `${BASE_URL}/secnum-activate-number`,
  RECOVERY_URL:          `${BASE_URL}/secnum-recovery`,
  MANAGE_URL:             `${BASE_URL}/secnum-number-manage`,
  STRIPE_URL:            `${BASE_URL}/payment-link-generator`,
  CRYPTO_URL:             `${BASE_URL}/secnum-crypto-checkout`,
  ORDER_RESULT_URL:      `${BASE_URL}/secnum-order-result`,
  QR_CREATE_SESSION_URL: `${BASE_URL}/qr-login-create-session`,
  QR_CONFIRM_URL:        `${BASE_URL}/qr-login-confirm/confirm`,
  PORT_REQUEST_URL:      `${BASE_URL}/port-number-request`,
  LIGHTPBX_CONFIG_URL:   `${BASE_URL}/lightpbx-config`,
};

export function getApiConfig() {
  return URLS;
}

export function isProductionGcp(): boolean {
  return BASE_URL.includes("arnacon-production-gcp");
}

/** Staging crypto UI keeps a testnet kicker. Production / store.cellact.nl must not. */
export function showCryptoTestnetKicker(): boolean {
  return !isProductionGcp();
}

/** Crypto checkout UI. Off only when VITE_ENABLE_CRYPTO=false. */
export function isCryptoEnabled(): boolean {
  const raw = String(import.meta.env.VITE_ENABLE_CRYPTO ?? "").trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}

/** Stripe / product metadata */
export const PACKAGE_ID = "secnum_number";
export const PACKAGE_NAME = "Israeli Mobile Number";
/** Stripe line item for secondary-number / FB campaign checkouts */
export const SECONDARY_PACKAGE_NAME = "Secondary Israeli Number";

/** Port-a-number package */
export const PORT_PACKAGE_ID = "secnum_port_number";
export const PORT_PACKAGE_NAME = "Israeli Number Porting";

/** Pricing (decimal strings — the GCP function multiplies by 100 internally) */
export const PRICE_DISPLAY_AMOUNT = "3.99";  // one-time setup fee
export const SUBSCRIPTION_PRICE   = "4.99";  // monthly subscription
export const PRICE_CURRENCY = "eur";
/** Display-only monthly price (short). Full setup+monthly lives in translated finePrint. */
export const PRICE_DISPLAY = "€4.99/mo";

/** Cellact / Arnacon support — https://www.cellact.com/contact-us/ */
export const SUPPORT_TEL = "+972557005555";
export const SUPPORT_TEL_DISPLAY = "+972 55 700 55 55";
/** Local Israeli display — do not run this through RTL */
export const SUPPORT_TEL_DISPLAY_IL = "055-700-5555";
export const SUPPORT_EMAIL = "support@arnacon.com";

/** Light PBX web2 (Base44) — package ids must match payment-link-generator + lightpbx-config plans. */
export const LIGHTPBX_PLANS = ["basic", "standard", "super"] as const;
export type LightPbxPlan = (typeof LIGHTPBX_PLANS)[number];

export const LIGHTPBX_PACKAGES: Record<
  LightPbxPlan,
  { packageId: string; packageName: string; /** Display-only; generator enforces EUR cents via env */ transactionPrice: string }
> = {
  basic: {
    packageId: "lightpbx_basic",
    packageName: "Light PBX — Basic",
    transactionPrice: "20.00",
  },
  standard: {
    packageId: "lightpbx_standard",
    packageName: "Light PBX — Standard",
    transactionPrice: "40.00",
  },
  super: {
    packageId: "lightpbx_super",
    packageName: "Light PBX — Super",
    transactionPrice: "80.00",
  },
};

/** lightpbx-store app origin (fulfillment lives there, not marketing `/`). */
export const LIGHTPBX_APP_URL = (
  import.meta.env.VITE_LIGHTPBX_APP_URL?.trim() ||
  "https://lightpbx-store.vercel.app"
).replace(/\/$/, "");

/** Docs / staging reference only — not used for checkout redirects unless set as VITE_LIGHTPBX_APP_URL. */
export const LIGHTPBX_APP_URL_STAGING = (
  import.meta.env.VITE_LIGHTPBX_APP_URL_STAGING?.trim() ||
  "https://lightpbx-store.vercel.app"
).replace(/\/$/, "");

export const LIGHTPBX_LANGS = ["en", "he", "nl"] as const;
export type LightPbxLang = (typeof LIGHTPBX_LANGS)[number];

export function parseLightPbxLang(value: string | null | undefined): LightPbxLang {
  const v = (value || "").trim().toLowerCase();
  if ((LIGHTPBX_LANGS as readonly string[]).includes(v)) return v as LightPbxLang;
  return "en";
}

/** Map plan short name or full packageId → plan. */
export function resolveLightPbxPlan(raw: string | null | undefined): LightPbxPlan | null {
  const v = (raw || "").trim().toLowerCase();
  if (!v) return null;
  if ((LIGHTPBX_PLANS as readonly string[]).includes(v)) return v as LightPbxPlan;
  for (const plan of LIGHTPBX_PLANS) {
    if (LIGHTPBX_PACKAGES[plan].packageId.toLowerCase() === v) return plan;
  }
  return null;
}

/**
 * Build lightpbx-store return URLs.
 * Success MUST include the literal Stripe placeholder `{CHECKOUT_SESSION_ID}` —
 * Stripe substitutes it; do not rely on generator auto-append alone.
 */
export function buildLightPbxSuccessUrl(systemId: string, lang: LightPbxLang): string {
  // Build query manually — never URLSearchParams for session_id.
  // URLSearchParams percent-encodes braces (%7B/%7D); Stripe only substitutes
  // the literal placeholder `{CHECKOUT_SESSION_ID}`.
  const base = `${LIGHTPBX_APP_URL}/billing/success`;
  const q = [
    "session_id={CHECKOUT_SESSION_ID}",
    `systemId=${encodeURIComponent(systemId)}`,
    `lang=${encodeURIComponent(lang)}`,
  ].join("&");
  return `${base}?${q}`;
}

export function buildLightPbxCancelUrl(systemId: string, lang: LightPbxLang): string {
  const u = new URL(`${LIGHTPBX_APP_URL}/billing/cancel`);
  u.searchParams.set("systemId", systemId);
  u.searchParams.set("lang", lang);
  return u.toString();
}

/** @deprecated Prefer buildLightPbxSuccessUrl — kept for any leftover imports */
export const LIGHTPBX_DEFAULT_SUCCESS_URL = `${LIGHTPBX_APP_URL}/billing/success`;
/** @deprecated Prefer buildLightPbxCancelUrl */
export const LIGHTPBX_DEFAULT_CANCEL_URL = `${LIGHTPBX_APP_URL}/billing/cancel`;

