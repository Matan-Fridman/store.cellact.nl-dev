import { useCallback, useEffect, useRef, useState } from "react";
import { activateWithProof, getGroupMembers } from "../services/api";
import { generateActivationProof } from "../utils/semaphore";
import type { ActivateResponse, AsyncStatus } from "../types";

export type ClaimErrorKind = "already_activated" | "generic";

interface ClaimState {
  status: AsyncStatus;
  step: number;
  data: ActivateResponse | null;
  error: string | null;
  errorKind: ClaimErrorKind | null;
}

const STEP_INTERVAL_MS = 8000;

/** Nullifier already spent / number already claimed on-chain. */
export function isAlreadyActivatedError(raw: unknown): boolean {
  const text = String(
    raw instanceof Error
      ? `${raw.name} ${raw.message}`
      : typeof raw === "string"
        ? raw
        : JSON.stringify(raw ?? ""),
  ).toLowerCase();

  return (
    text.includes("already_activated") ||
    text.includes("youareusingthesamenullifiertwice") ||
    text.includes("same nullifier") ||
    text.includes("nullifier twice") ||
    text.includes("0x208b15e8")
  );
}

export function useClaim() {
  const [state, setState] = useState<ClaimState>({
    status: "idle",
    step: 0,
    data: null,
    error: null,
    errorKind: null,
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
    async (secret: string, label: string, web3identity: string) => {
      setState({
        status: "loading",
        step: 1,
        data: null,
        error: null,
        errorKind: null,
      });

      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.step < 3) return { ...prev, step: prev.step + 1 };
          return prev;
        });
      }, STEP_INTERVAL_MS);

      try {
        const { commitments, scope, merkleTreeRoot } = await getGroupMembers();
        const proof = await generateActivationProof(
          secret,
          label,
          commitments,
          scope,
          merkleTreeRoot,
        );
        const data = await activateWithProof(proof, label, web3identity);
        clearStepInterval();
        setState({
          status: "success",
          step: 4,
          data,
          error: null,
          errorKind: null,
        });
      } catch (err) {
        clearStepInterval();
        const message = err instanceof Error ? err.message : "Claim failed";
        const already = isAlreadyActivatedError(err) || isAlreadyActivatedError(message);
        setState({
          status: "error",
          step: 0,
          data: null,
          error: message,
          errorKind: already ? "already_activated" : "generic",
        });
      }
    },
    [clearStepInterval],
  );

  const reset = useCallback(() => {
    clearStepInterval();
    setState({
      status: "idle",
      step: 0,
      data: null,
      error: null,
      errorKind: null,
    });
  }, [clearStepInterval]);

  return { ...state, claim, reset };
}
