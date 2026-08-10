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
import type { AsyncStatus } from "../types";

interface PurchaseState {
  status: AsyncStatus;
  error: string | null;
}

function generateUserId(): string {
  return crypto.randomUUID();
}

function buildSuccessUrl(): string {
  return `${window.location.origin}/success`;
}

function buildFailureUrl(): string {
  return `${window.location.origin}/?payment=cancelled`;
}

export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({ status: "idle", error: null });

  const initiate = useCallback(async () => {
    setState({ status: "loading", error: null });
    trackInitiateCheckout();

    const secondary = shouldShowConversionLanding();

    try {
      const { url } = await createCheckoutSession({
        packageId: PACKAGE_ID,
        packageName: secondary ? SECONDARY_PACKAGE_NAME : PACKAGE_NAME,
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
