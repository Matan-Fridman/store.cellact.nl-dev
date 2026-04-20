import { useCallback, useState } from "react";
import { createCheckoutSession, getOrderResult } from "../services/api";
import { getUseProduction } from "../config/constants";
import {
  PACKAGE_ID,
  PACKAGE_NAME,
  PRICE_DISPLAY_AMOUNT,
  SUBSCRIPTION_PRICE,
  PRICE_CURRENCY,
} from "../config/constants";
import type { AsyncStatus, PurchaseResponse } from "../types";
import { buildArnaconClaimUrl } from "../utils/format";

interface PurchaseState {
  status: AsyncStatus;
  data: PurchaseResponse | null;
  error: string | null;
}

function generateUserId(): string {
  return crypto.randomUUID();
}

function buildSuccessUrl(): string {
  const prod = getUseProduction();
  // Must be a bare URL — the GCP function appends ?session_id=<uuid>&user_address=<id>
  return `${window.location.origin}/success?dev=${prod ? "false" : "true"}`;
}

function buildFailureUrl(): string {
  // Must be a bare URL — the GCP function appends ?user_address=<id>
  const prod = getUseProduction();
  return `${window.location.origin}/?dev=${prod ? "false" : "true"}`;
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
      });

      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start checkout";
      setState({ status: "error", data: null, error: message });
    }
  }, []);

  /**
   * Step 2 — Called from SuccessPage with session_id (order UUID).
   * Polls the webhook until provision is done (claimUrl from server, or label+userSecret to build locally).
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
        let claimUrl = result.claimUrl;
        const label = result.label ?? undefined;
        const userSecret = result.userSecret ?? undefined;
        if (!claimUrl && label && userSecret) {
          claimUrl = buildArnaconClaimUrl(userSecret, label, window.location.origin, getUseProduction());
        }
        if (claimUrl) {
          setState({
            status: "success",
            data: { claimUrl, ...(label ? { label } : {}), ...(userSecret ? { userSecret } : {}) },
            error: null,
          });
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
