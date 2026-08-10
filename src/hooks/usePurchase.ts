import { useCallback, useState } from "react";
import { createCheckoutSession } from "../services/api";
import { getUseProduction } from "../config/constants";
import {
  PACKAGE_ID,
  PACKAGE_NAME,
  PRICE_DISPLAY_AMOUNT,
  SUBSCRIPTION_PRICE,
  PRICE_CURRENCY,
} from "../config/constants";
import { trackInitiateCheckout } from "../lib/analytics";
import type { AsyncStatus } from "../types";

interface PurchaseState {
  status: AsyncStatus;
  error: string | null;
}

function generateUserId(): string {
  return crypto.randomUUID();
}

function buildSuccessUrl(): string {
  const prod = getUseProduction();
  return `${window.location.origin}/success?dev=${prod ? "false" : "true"}`;
}

function buildFailureUrl(): string {
  const prod = getUseProduction();
  const params = new URLSearchParams({
    payment: "cancelled",
    dev: prod ? "false" : "true",
  });
  return `${window.location.origin}/?${params.toString()}`;
}

export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({ status: "idle", error: null });

  const initiate = useCallback(async () => {
    setState({ status: "loading", error: null });
    trackInitiateCheckout();

    try {
      const { url } = await createCheckoutSession({
        packageId: PACKAGE_ID,
        packageName: PACKAGE_NAME,
        transactionPrice: PRICE_DISPLAY_AMOUNT,
        subscriptionPrice: SUBSCRIPTION_PRICE,
        currency: PRICE_CURRENCY,
        successUrl: buildSuccessUrl(),
        failureUrl: buildFailureUrl(),
        userId: generateUserId(),
      });

      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start checkout";
      setState({ status: "error", error: message });
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle", error: null }), []);

  return { ...state, initiate, reset };
}
