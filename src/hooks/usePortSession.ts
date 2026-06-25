import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getDb } from "../lib/firebase";
import {
  createPortSession,
  submitPortRequest,
  type PortSession,
} from "../services/portApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PortStep = "init" | "qr" | "authenticated" | "submitted" | "error";

interface PortState {
  step: PortStep;
  session: PortSession | null;
  walletAddress: string | null;
  submittedNumber: string | null;
  error: string | null;
  submitting: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePortSession() {
  const [state, setState] = useState<PortState>({
    step: "init",
    session: null,
    walletAddress: null,
    submittedNumber: null,
    error: null,
    submitting: false,
  });

  const unsubRef = useRef<Unsubscribe | null>(null);

  const stopListening = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  }, []);

  const startSession = useCallback(async () => {
    stopListening();
    setState({ step: "init", session: null, walletAddress: null, submittedNumber: null, error: null, submitting: false });

    try {
      const session = await createPortSession();
      setState((prev) => ({ ...prev, step: "qr", session }));

      // Listen to the Firestore document the server writes to when the
      // Arnacon app scans the QR and posts its wallet address.
      const db = getDb();
      unsubRef.current = onSnapshot(
        doc(db, "qrLoginSessions", session.sessionId),
        (snap) => {
          const data = snap.data();
          if (data?.status === "confirmed" && data.address) {
            stopListening();
            setState((prev) => ({
              ...prev,
              step: "authenticated",
              walletAddress: data.address as string,
            }));
          }
        },
        (err) => {
          console.error("[usePortSession] snapshot error", err);
          stopListening();
          setState((prev) => ({
            ...prev,
            step: "error",
            error: "Lost connection to the server. Please try again.",
          }));
        },
      );
    } catch {
      setState((prev) => ({
        ...prev,
        step: "error",
        error: "Could not start a session. Please try again.",
      }));
    }
  }, [stopListening]);

  const submitPort = useCallback(
    async (phoneNumber: string) => {
      if (!state.session || !state.walletAddress) return;
      setState((prev) => ({ ...prev, submitting: true, error: null }));
      try {
        await submitPortRequest(state.session.sessionId, state.walletAddress, phoneNumber);
        setState((prev) => ({
          ...prev,
          step: "submitted",
          submittedNumber: phoneNumber,
          submitting: false,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          submitting: false,
          error: "Failed to submit porting request. Please try again.",
        }));
      }
    },
    [state.session, state.walletAddress],
  );

  const reset = useCallback(() => {
    stopListening();
    setState({ step: "init", session: null, walletAddress: null, submittedNumber: null, error: null, submitting: false });
  }, [stopListening]);

  // Cleanup listener on unmount
  useEffect(() => () => stopListening(), [stopListening]);

  return { ...state, startSession, submitPort, reset };
}
