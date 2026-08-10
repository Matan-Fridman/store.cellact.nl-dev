/**
 * Site analytics + Meta Pixel helpers.
 * Custom GCP tracker stays the source of truth for our own funnel;
 * Meta Pixel is for Facebook ad optimization when VITE_META_PIXEL_ID is set.
 */

import {
  captureAttribution,
  getAbVariant,
  getAttribution,
  isFacebookTraffic,
} from "./campaign";
import {
  PRICE_CURRENCY,
  PRICE_DISPLAY_AMOUNT,
  SUBSCRIPTION_PRICE,
} from "../config/constants";

const ANALYTICS_URL =
  "https://europe-west1-arnacon-production-gcp.cloudfunctions.net/website-analytics";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

let pixelReady = false;

export function initAnalytics(): void {
  captureAttribution();
  initMetaPixel();
}

function getPixelId(): string | undefined {
  const id = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
  return id?.trim() || undefined;
}

export function initMetaPixel(): void {
  if (typeof window === "undefined" || pixelReady) return;
  const pixelId = getPixelId();
  if (!pixelId) return;

  // Standard Meta Pixel bootstrap
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const f = window as any;
  if (f.fbq) {
    pixelReady = true;
    return;
  }
  const n: any = (f.fbq = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  });
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  const t = document.createElement("script");
  t.async = true;
  t.src = "https://connect.facebook.net/en_US/fbevents.js";
  const s = document.getElementsByTagName("script")[0];
  s?.parentNode?.insertBefore(t, s);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  window.fbq?.("init", pixelId);
  window.fbq?.("track", "PageView");
  pixelReady = true;
}

function metaTrack(event: string, params?: Record<string, unknown>): void {
  if (!getPixelId()) return;
  if (!pixelReady) initMetaPixel();
  try {
    if (params) window.fbq?.("track", event, params);
    else window.fbq?.("track", event);
  } catch {
    // never break UX
  }
}

function basePayload(): Record<string, unknown> {
  const attr = getAttribution();
  return {
    source: "secnumnl",
    isFacebook: isFacebookTraffic(),
    abVariant: isFacebookTraffic() ? getAbVariant() : null,
    language: typeof navigator !== "undefined" ? navigator.language : undefined,
    uiLang:
      typeof document !== "undefined" ? document.documentElement.lang : undefined,
    screenWidth: typeof window !== "undefined" ? window.innerWidth : undefined,
    screenHeight: typeof window !== "undefined" ? window.innerHeight : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    referrer: attr.referrer || (typeof document !== "undefined" ? document.referrer || "direct" : "direct"),
    utm_source: attr.utm_source,
    utm_medium: attr.utm_medium,
    utm_campaign: attr.utm_campaign,
    utm_content: attr.utm_content,
    utm_term: attr.utm_term,
    fbclid: attr.fbclid,
  };
}

export async function trackEvent(
  event: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  try {
    await fetch(ANALYTICS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...basePayload(),
        event,
        page:
          typeof window !== "undefined" ? window.location.pathname : undefined,
        ...extra,
      }),
      keepalive: true,
    });
  } catch {
    // Silent — analytics must never break the store UX
  }
}

export function trackPageView(pathname: string): void {
  void trackEvent("page_view", { page: pathname });
  // Pixel PageView already fired on init; fire again on SPA navigations
  if (pixelReady) {
    try {
      window.fbq?.("track", "PageView");
    } catch {
      // ignore
    }
  }
}

export function trackViewContent(): void {
  void trackEvent("view_content");
  metaTrack("ViewContent", {
    content_name: "Israeli Mobile Number",
    content_category: "secnum",
    currency: PRICE_CURRENCY.toUpperCase(),
    value: Number(SUBSCRIPTION_PRICE),
  });
}

export function trackInitiateCheckout(): void {
  const value = Number(PRICE_DISPLAY_AMOUNT) + Number(SUBSCRIPTION_PRICE);
  void trackEvent("initiate_checkout", { value, currency: PRICE_CURRENCY });
  metaTrack("InitiateCheckout", {
    content_name: "Israeli Mobile Number",
    currency: PRICE_CURRENCY.toUpperCase(),
    value,
    num_items: 1,
  });
}

export function trackPurchase(sessionId?: string | null): void {
  const value = Number(PRICE_DISPLAY_AMOUNT) + Number(SUBSCRIPTION_PRICE);
  void trackEvent("purchase", {
    value,
    currency: PRICE_CURRENCY,
    session_id: sessionId ?? undefined,
  });
  metaTrack("Purchase", {
    content_name: "Israeli Mobile Number",
    currency: PRICE_CURRENCY.toUpperCase(),
    value,
    num_items: 1,
  });
}

export function trackOfferImpression(): void {
  void trackEvent("offer_impression", { abVariant: getAbVariant() });
}

export function trackOfferClick(): void {
  void trackEvent("offer_click", { abVariant: getAbVariant() });
}

export function trackCheckoutCancel(): void {
  void trackEvent("checkout_cancel");
}
