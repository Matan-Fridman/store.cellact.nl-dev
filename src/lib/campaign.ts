/**
 * Facebook / paid-campaign attribution, A/B assignment, and offer config.
 * Persists in sessionStorage so Stripe round-trips keep the same variant.
 */

const ATTR_KEY = "secnum_attr";
const AB_KEY = "secnum_ab";

export type AbVariant = "control" | "offer";

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  referrer?: string;
  capturedAt: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

/** Capture UTMs / fbclid once per session (first touch wins). */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") {
    return { capturedAt: new Date().toISOString() };
  }

  const existing = readJson<Attribution>(ATTR_KEY);
  const params = new URLSearchParams(window.location.search);

  const incoming: Attribution = {
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    utm_content: params.get("utm_content") ?? undefined,
    utm_term: params.get("utm_term") ?? undefined,
    fbclid: params.get("fbclid") ?? undefined,
    referrer: document.referrer || undefined,
    capturedAt: new Date().toISOString(),
  };

  const hasIncoming = Boolean(
    incoming.utm_source ||
      incoming.utm_medium ||
      incoming.utm_campaign ||
      incoming.fbclid,
  );

  if (existing && !hasIncoming) return existing;

  const merged: Attribution = {
    ...existing,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, v]) => v !== undefined && v !== ""),
    ),
    capturedAt: existing?.capturedAt ?? incoming.capturedAt,
    referrer: existing?.referrer || incoming.referrer,
  };

  writeJson(ATTR_KEY, merged);
  return merged;
}

export function getAttribution(): Attribution {
  return readJson<Attribution>(ATTR_KEY) ?? captureAttribution();
}

export function isFacebookTraffic(): boolean {
  const a = getAttribution();
  const source = (a.utm_source ?? "").toLowerCase();
  const medium = (a.utm_medium ?? "").toLowerCase();
  const ref = (a.referrer ?? "").toLowerCase();

  if (a.fbclid) return true;
  if (["facebook", "fb", "meta", "ig", "instagram"].includes(source)) return true;
  if (medium === "paid_social" && (source.includes("fb") || source.includes("meta"))) return true;
  if (ref.includes("facebook.com") || ref.includes("fb.com") || ref.includes("instagram.com")) {
    return true;
  }
  // Explicit campaign flag for testing / short links
  try {
    if (sessionStorage.getItem("secnum_force_fb") === "1") return true;
    if (new URLSearchParams(window.location.search).get("from") === "fb") return true;
  } catch {
    // ignore
  }
  return false;
}

/** Sticky 50/50 A/B for Facebook visitors only. */
export function getAbVariant(): AbVariant {
  if (typeof window === "undefined") return "control";
  if (!isFacebookTraffic()) return "control";

  const stored = sessionStorage.getItem(AB_KEY);
  if (stored === "control" || stored === "offer") return stored;

  const assigned: AbVariant = Math.random() < 0.5 ? "control" : "offer";
  try {
    sessionStorage.setItem(AB_KEY, assigned);
  } catch {
    // ignore
  }
  return assigned;
}

/** Stripe coupon id for FB offer variant — only show 30% UI when set. */
export function getFbCouponId(): string | undefined {
  const id = import.meta.env.VITE_STRIPE_FB_COUPON_ID as string | undefined;
  return id?.trim() || undefined;
}

/** Offer A/B arm: soft banner (and coupon when configured). */
export function shouldShowOfferUi(): boolean {
  return isFacebookTraffic() && getAbVariant() === "offer";
}

/** True 30% discount path — only when Stripe coupon env is present. */
export function shouldApplyFbCoupon(): boolean {
  return shouldShowOfferUi() && Boolean(getFbCouponId());
}

export function shouldShowFbLanding(): boolean {
  return isFacebookTraffic();
}
