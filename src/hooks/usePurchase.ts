import { useCallback, useState } from "react";
import { createCheckoutSession, getOrderResult } from "../services/api";
import {
  PACKAGE_ID,
  PACKAGE_NAME,
  PRICE_DISPLAY_AMOUNT,
  SUBSCRIPTION_PRICE,
  PRICE_CURRENCY,
} from "../config/constants";
import type { AsyncStatus, PurchaseResponse } from "../types";

interface PurchaseState {
  status: AsyncStatus;
  data: PurchaseResponse | null;
  error: string | null;
}

function generateUserId(): string {
  return crypto.randomUUID();
}

function buildSuccessUrl(): string {
  // Must be a bare URL — the GCP function appends ?session_id=<uuid>&user_address=<id>
  return `${window.location.origin}/success`;
}

function buildFailureUrl(): string {
  // Must be a bare URL — the GCP function appends ?user_address=<id>
  return `${window.location.origin}/`;
}

export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({
    status: "idle",
    data: null,
    error: null,
  });

  /**
   * Step 1 — Create a Stripe Checkout session via the GCP endpoint and redirect.
   * The browser leaves the page; control returns via /success?stripe_sid=cs_xxx.
   */
  const initiate = useCallback(async () => {
    setState({ status: "loading", data: null, error: null });

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
        isProd: false, // use Stripe test key (STRIPE_API_KEY)
      });

      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start checkout";
      setState({ status: "error", data: null, error: message });
    }
  }, []);

  /**
   * Step 2 — Called from SuccessPage with session_id (order UUID).
   * Polls the webhook app's order-result until claimUrl is set by the webhook.
   */
  const completePurchase = useCallback(async (sessionId: string) => {
    setState({ status: "loading", data: null, error: null });

    const POLL_INTERVAL_MS = 2000;
    const MAX_ATTEMPTS = 45; // ~90s

    let attempt = 0;

    const poll = async (): Promise<void> => {
      attempt += 1;
      try {
        const result = await getOrderResult(sessionId);
        if (result.claimUrl) {
          setState({ status: "success", data: { claimUrl: result.claimUrl }, error: null });
          return;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not load your number";
        setState({ status: "error", data: null, error: message });
        return;
      }
      if (attempt >= MAX_ATTEMPTS) {
        setState({
          status: "error",
          data: null,
          error: "Provision is taking longer than expected. Please check your email or contact support.",
        });
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    setTimeout(poll, 0);
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", data: null, error: null });
  }, []);

  return { ...state, initiate, completePurchase, reset };
}
