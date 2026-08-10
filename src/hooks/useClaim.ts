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

function errorBlob(raw: unknown): string {
  if (raw instanceof Error) {
    // Include cause / nested fields when present — ethers puts the selector there.
    const extra = [
      (raw as Error & { data?: unknown }).data,
      (raw as Error & { error?: unknown }).error,
      (raw as Error & { reason?: unknown }).reason,
    ]
      .filter(Boolean)
      .map((v) => {
        try {
          return typeof v === "string" ? v : JSON.stringify(v);
        } catch {
          return String(v);
        }
      })
      .join(" ");
    return `${raw.name} ${raw.message} ${extra}`.toLowerCase();
  }
  if (typeof raw === "string") return raw.toLowerCase();
  try {
    return JSON.stringify(raw ?? "").toLowerCase();
  } catch {
    return String(raw ?? "").toLowerCase();
  }
}

/**
 * Nullifier already spent / number already claimed on-chain.
 * Ethers often returns a giant CALL_EXCEPTION dump without a readable reason —
 * on the claim page that dump almost always means "already activated".
 */
export function isAlreadyActivatedError(raw: unknown): boolean {
  const text = errorBlob(raw);

  if (
    text.includes("already_activated") ||
    text.includes("youareusingthesamenullifiertwice") ||
    text.includes("same nullifier") ||
    text.includes("nullifier twice") ||
    text.includes("0x208b15e8") ||
    text.includes("208b15e8")
  ) {
    return true;
  }

  // Raw provider dump from a failed validateProof / activate tx.
  const looksLikeChainDump =
    text.includes("call_exception") ||
    text.includes("call revert exception") ||
    text.includes("transactionindex") ||
    (text.includes("gasused") && text.includes("contractaddress"));

  return looksLikeChainDump;
}

/** Never show ethers / RPC dumps in the UI. */
export function sanitizeClaimErrorMessage(message: string, kind: ClaimErrorKind): string | null {
  if (kind === "already_activated") return null; // UI uses dedicated copy
  const lower = message.toLowerCase();
  if (
    message.length > 180 ||
    lower.includes("call_exception") ||
    lower.includes("transactionindex") ||
    lower.includes("0x")
  ) {
    return null; // ClaimCard will show a short fallback
  }
  return message;
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
