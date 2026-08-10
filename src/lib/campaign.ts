/**
 * Attribution + site-wide landing UX A/B + Facebook campaign chrome.
 *
 * Experiment: landing_ux_v1 (ALL visitors)
 *   control     — classic “local Israeli number on your phone” landing
 *   conversion  — secondary-number messaging, clearer price, fewer competing CTAs
 *
 * Facebook traffic (in addition to A/B):
 *   Hebrew default, welcome strip aligned to the ad, hide App Store competition
 */

const ATTR_KEY = "secnum_attr";
const AB_KEY = "secnum_ab_landing_ux_v1";
const EXPOSURE_KEY = "secnum_exp_exposed_landing_ux_v1";
const FB_BANNER_KEY = "secnum_fb_banner_dismissed";

export const EXPERIMENT_ID = "landing_ux_v1";
export type AbVariant = "control" | "conversion";

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

export function isFacebookTraffic(): boolean {
  const a = getAttribution();
  const source = (a.utm_source ?? "").toLowerCase();
  const medium = (a.utm_medium ?? "").toLowerCase();
  const ref = (a.referrer ?? "").toLowerCase();

  let hit = false;
  if (a.fbclid) hit = true;
  else if (["facebook", "fb", "meta", "ig", "instagram"].includes(source)) hit = true;
  else if (medium === "paid_social" && (source.includes("fb") || source.includes("meta"))) hit = true;
  else if (ref.includes("facebook.com") || ref.includes("fb.com") || ref.includes("instagram.com")) {
    hit = true;
  } else {
    try {
      if (sessionStorage.getItem("secnum_force_fb") === "1") hit = true;
      else if (new URLSearchParams(window.location.search).get("from") === "fb") hit = true;
    } catch {
      // ignore
    }
  }

  // Stick for the session so Stripe return / deep links keep FB chrome.
  if (hit) markFacebookSession();
  return hit;
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

/** Facebook-only chrome: welcome strip, quieter header badges. */
export function shouldShowFacebookChrome(): boolean {
  return isFacebookTraffic();
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
  try {
    if (sessionStorage.getItem(EXPOSURE_KEY) === "1") return false;
    sessionStorage.setItem(EXPOSURE_KEY, "1");
    return true;
  } catch {
    return true;
  }
}
