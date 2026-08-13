import { useCallback, useState } from "react";
import { createCheckoutSession } from "../services/api";
import {
  PACKAGE_ID,
  PACKAGE_NAME,
  SECONDARY_PACKAGE_NAME,
  PRICE_DISPLAY_AMOUNT,
  SUBSCRIPTION_PRICE,
  PRICE_CURRENCY,
} from "../config/constants";
import { trackInitiateCheckout } from "../lib/analytics";
import { shouldShowConversionLanding } from "../lib/campaign";
import { useLanguage } from "../contexts/LanguageContext";
import type { AsyncStatus } from "../types";

interface PurchaseState {
  status: AsyncStatus;
  error: string | null;
}

function generateUserId(): string {
  return crypto.randomUUID();
}

/** Absolute store URL with purchase language (and optional extra query params). */
function buildStoreUrl(
  path: string,
  lang: "en" | "he",
  extra?: Record<string, string>,
): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set("lang", lang);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

export function usePurchase(options?: { cancelPath?: string }) {
  const { lang } = useLanguage();
  const [state, setState] = useState<PurchaseState>({ status: "idle", error: null });
  const cancelPath = options?.cancelPath || "/";

  const initiate = useCallback(async () => {
    setState({ status: "loading", error: null });
    trackInitiateCheckout();

    const secondary = shouldShowConversionLanding();
    const purchaseLang = lang === "he" ? "he" : "en";

    try {
      const { url } = await createCheckoutSession({
        packageId: PACKAGE_ID,
        packageName: secondary ? SECONDARY_PACKAGE_NAME : PACKAGE_NAME,
        transactionPrice: PRICE_DISPLAY_AMOUNT,
        subscriptionPrice: SUBSCRIPTION_PRICE,
        currency: PRICE_CURRENCY,
        successUrl: buildStoreUrl("/success", purchaseLang),
        failureUrl: buildStoreUrl(cancelPath, purchaseLang, { payment: "cancelled" }),
        userId: generateUserId(),
        lang: purchaseLang,
      });

      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start checkout";
      setState({ status: "error", error: message });
    }
  }, [lang, cancelPath]);

  const reset = useCallback(() => setState({ status: "idle", error: null }), []);

  return { ...state, initiate, reset };
}
