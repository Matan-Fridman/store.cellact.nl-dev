/**
 * Attribution + landing UX A/B + Facebook offer A/B.
 *
 * Landing experiment (non-FB): landing_ux_v2
 *   control     — Original page (“local Israeli number on your phone”)
 *   conversion  — Secondary-number page (no primary SIM / device you already have)
 *
 * Facebook offer experiment (FB traffic only): fb_offer_v1
 *   nocoupon  — Secondary-number offer, full price
 *   coupon30  — Same + 30% for first 3 months (code SecNumAgain30)
 *   coupon67  — Dedicated /67 page, 67% for first 3 months (code BEST67DEAL)
 *
 * Facebook always uses the secondary-number landing + Hebrew default.
 */

const ATTR_KEY = "secnum_attr";
const AB_KEY = "secnum_ab_landing_ux_v2";
const EXPOSURE_KEY = "secnum_exp_exposed_landing_ux_v2";
const FB_AB_KEY = "secnum_fb_offer_v1";
const FB_EXPOSURE_KEY = "secnum_fb_offer_exposed_v1";
const FB_BANNER_KEY = "secnum_fb_banner_dismissed";

export const EXPERIMENT_ID = "landing_ux_v2";
export const FB_OFFER_EXPERIMENT_ID = "fb_offer_v1";
export const FB_COUPON_CODE = "SecNumAgain30";
export const FB_COUPON_CODE_67 = "BEST67DEAL";

export type AbVariant = "control" | "conversion";
export type FbOfferVariant = "nocoupon" | "coupon30" | "coupon67";

function isFbOfferVariant(value: string | null): value is FbOfferVariant {
  return value === "nocoupon" || value === "coupon30" || value === "coupon67";
}

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
    // ignore
  }
}

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

function markFacebookSession(): void {
  try {
    sessionStorage.setItem("secnum_force_fb", "1");
  } catch {
    // ignore
  }
}

/** This navigation’s query string — not a leftover tab session. */
export function hasFacebookLandingParams(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fbclid")) return true;
    if (params.get("from") === "fb") return true;
    if (params.get("fbBanner") === "1") return true;
    if (isFbOfferVariant(params.get("fbOffer"))) return true;
    const source = (params.get("utm_source") ?? "").toLowerCase();
    if (["facebook", "fb", "meta", "ig", "instagram"].includes(source)) return true;
    const medium = (params.get("utm_medium") ?? "").toLowerCase();
    if (medium === "paid_social" && (source.includes("fb") || source.includes("meta"))) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function isFacebookTraffic(): boolean {
  if (hasFacebookLandingParams()) {
    markFacebookSession();
    return true;
  }

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
  try {
    if (sessionStorage.getItem("secnum_force_fb") === "1") return true;
  } catch {
    // ignore
  }
  return false;
}

/** Sticky 50/50 A/B for ALL visitors. Override with ?ab=control|conversion */
export function getAbVariant(): AbVariant {
  if (typeof window === "undefined") return "control";

  try {
    const forced = new URLSearchParams(window.location.search).get("ab");
    if (forced === "control" || forced === "conversion") {
      sessionStorage.setItem(AB_KEY, forced);
      return forced;
    }
  } catch {
    // ignore
  }

  const stored = sessionStorage.getItem(AB_KEY);
  if (stored === "control" || stored === "conversion") return stored;

  const assigned: AbVariant = Math.random() < 0.5 ? "control" : "conversion";
  try {
    sessionStorage.setItem(AB_KEY, assigned);
  } catch {
    // ignore
  }
  return assigned;
}

/**
 * Landing copy: conversion arm for everyone in that variant.
 * Facebook visitors always get the secondary-number landing so the page matches the ad.
 */
export function shouldShowConversionLanding(): boolean {
  if (isFacebookTraffic()) return true;
  return getAbVariant() === "conversion";
}

export function clearFbBannerDismiss(): void {
  try {
    sessionStorage.removeItem(FB_BANNER_KEY);
  } catch {
    // ignore
  }
}

/**
 * Facebook-only chrome: offer modal, quieter header badges.
 * Also honors ?fbOffer= / ?fbBanner=1 so QA works without a prior FB session.
 */
export function shouldShowFacebookChrome(): boolean {
  if (!hasFacebookLandingParams()) return false;
  markFacebookSession();
  return true;
}

/** Sticky 3-way FB offer A/B. Override with ?fbOffer=nocoupon|coupon30|coupon67 */
export function getFbOfferVariant(): FbOfferVariant {
  if (typeof window === "undefined") return "nocoupon";

  try {
    const forced = new URLSearchParams(window.location.search).get("fbOffer");
    if (isFbOfferVariant(forced)) {
      sessionStorage.setItem(FB_AB_KEY, forced);
      // Preview URLs must reopen the modal even if you closed it earlier this session.
      if (forced !== "coupon67") clearFbBannerDismiss();
      return forced;
    }
  } catch {
    // ignore
  }

  try {
    const path = window.location.pathname.replace(/\/+$/, "");
    if (path.endsWith("/67")) {
      sessionStorage.setItem(FB_AB_KEY, "coupon67");
      return "coupon67";
    }
  } catch {
    // ignore
  }

  const stored = sessionStorage.getItem(FB_AB_KEY);
  if (isFbOfferVariant(stored)) return stored;

  const roll = Math.random();
  const assigned: FbOfferVariant =
    roll < 1 / 3 ? "nocoupon" : roll < 2 / 3 ? "coupon30" : "coupon67";
  try {
    sessionStorage.setItem(FB_AB_KEY, assigned);
  } catch {
    // ignore
  }
  return assigned;
}

export function isSixSevenOffer(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const path = window.location.pathname.replace(/\/+$/, "");
    if (path.endsWith("/67")) return true;
    if (new URLSearchParams(window.location.search).get("fbOffer") === "coupon67") {
      return true;
    }
  } catch {
    // ignore
  }
  try {
    return sessionStorage.getItem(FB_AB_KEY) === "coupon67";
  } catch {
    return false;
  }
}

export function forceCoupon67Offer(): void {
  try {
    sessionStorage.setItem(FB_AB_KEY, "coupon67");
  } catch {
    // ignore
  }
}

export function getActiveExperiment(): {
  experimentId: string;
  abVariant: string;
} {
  if (isSixSevenOffer()) {
    forceCoupon67Offer();
    return {
      experimentId: FB_OFFER_EXPERIMENT_ID,
      abVariant: "coupon67",
    };
  }
  if (isFacebookTraffic()) {
    return {
      experimentId: FB_OFFER_EXPERIMENT_ID,
      abVariant: getFbOfferVariant(),
    };
  }
  return {
    experimentId: EXPERIMENT_ID,
    abVariant: getAbVariant(),
  };
}

export function isFbBannerDismissed(): boolean {
  try {
    return sessionStorage.getItem(FB_BANNER_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissFbBanner(): void {
  try {
    sessionStorage.setItem(FB_BANNER_KEY, "1");
  } catch {
    // ignore
  }
}

export function markExperimentExposed(): boolean {
  const key = isFacebookTraffic() ? FB_EXPOSURE_KEY : EXPOSURE_KEY;
  try {
    if (sessionStorage.getItem(key) === "1") return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}
