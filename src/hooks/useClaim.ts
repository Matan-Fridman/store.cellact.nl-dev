import { useCallback, useEffect, useRef, useState } from "react";
import { activateNumber } from "../services/api";
import type { ActivateResponse, AsyncStatus } from "../types";

interface ClaimState {
  status: AsyncStatus;
  step: number;
  data: ActivateResponse | null;
  error: string | null;
}

const STEP_INTERVAL_MS = 2200;
const MIN_LOADING_MS = STEP_INTERVAL_MS * 3; // show all 3 steps before resolving

export function useClaim() {
  const [state, setState] = useState<ClaimState>({
    status: "idle",
    step: 0,
    data: null,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearStepInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearStepInterval, [clearStepInterval]);

  const claim = useCallback(
    async (secret: string, label: string, owner: string) => {
      setState({ status: "loading", step: 1, data: null, error: null });

      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.step < 3) return { ...prev, step: prev.step + 1 };
          return prev;
        });
      }, STEP_INTERVAL_MS);

      try {
        const [data] = await Promise.all([
          activateNumber(secret, label, owner),
          new Promise<void>((r) => setTimeout(r, MIN_LOADING_MS)),
        ]);
        clearStepInterval();
        setState({ status: "success", step: 4, data, error: null });
      } catch (err) {
        clearStepInterval();
        const message =
          err instanceof Error ? err.message : "Claim failed";
        setState({ status: "error", step: 0, data: null, error: message });
      }
    },
    [clearStepInterval],
  );

  const reset = useCallback(() => {
    clearStepInterval();
    setState({ status: "idle", step: 0, data: null, error: null });
  }, [clearStepInterval]);

  return { ...state, claim, reset };
}
