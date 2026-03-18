import { useCallback, useState } from "react";
import { purchaseNumber } from "../services/api";
import type { AsyncStatus, PurchaseResponse } from "../types";
//
interface PurchaseState {
  status: AsyncStatus;
  data: PurchaseResponse | null;
  error: string | null;
}

export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({
    status: "idle",
    data: null,
    error: null,
  });

  const purchase = useCallback(async (label: string) => {
    setState({ status: "loading", data: null, error: null });

    try {
      const data = await purchaseNumber(label);
      setState({ status: "success", data, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Purchase failed";
      setState({ status: "error", data: null, error: message });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", data: null, error: null });
  }, []);

  return { ...state, purchase, reset };
}
