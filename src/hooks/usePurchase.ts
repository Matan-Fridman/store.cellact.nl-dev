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
  return `${window.location.origin}/?dev=${prod ? "false" : "true"}`;
}

export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({ status: "idle", error: null });

  /**
   * Creates a Stripe Checkout session and redirects the browser to Stripe.
   * On success Stripe redirects to /success?session_id=<uuid> — no polling needed.
   * The backend emails an activation link containing a one-time claim token.
   */
  const initiate = useCallback(async () => {
    setState({ status: "loading", error: null });

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
