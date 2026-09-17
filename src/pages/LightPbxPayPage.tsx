import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createLightPbxCheckoutSession } from "../services/api";
import {
  LIGHTPBX_DEFAULT_CANCEL_URL,
  LIGHTPBX_DEFAULT_SUCCESS_URL,
  LIGHTPBX_PLANS,
  type LightPbxPlan,
} from "../config/constants";

function isPlan(value: string | null): value is LightPbxPlan {
  return !!value && (LIGHTPBX_PLANS as readonly string[]).includes(value);
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Prefer top window so Base44 iframes / in-app WebViews can reach Stripe Checkout. */
function navigateToCheckout(url: string) {
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.assign(url);
      return;
    }
  } catch {
    // cross-origin frame: fall through
  }
  window.location.assign(url);
}

/**
 * Base44 entrypoint: /lightpbx/pay?systemId=&userId=&plan=basic|standard|super
 * Optional: success_url, cancel_url (https). Defaults to VITE_LIGHTPBX_* staging placeholders.
 * Redirects to Stripe Checkout (top-level); on success Stripe returns to Base44 with session_id=cs_…
 */
export function LightPbxPayPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "redirecting" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  const systemId = (params.get("systemId") || params.get("system_id") || "").trim();
  const userId = (params.get("userId") || params.get("user_id") || "").trim();
  const planRaw = (params.get("plan") || "").trim().toLowerCase();
  const successUrl = (
    params.get("success_url") ||
    params.get("successUrl") ||
    LIGHTPBX_DEFAULT_SUCCESS_URL
  ).trim();
  const cancelUrl = (
    params.get("cancel_url") ||
    params.get("cancelUrl") ||
    LIGHTPBX_DEFAULT_CANCEL_URL
  ).trim();
  const lang = params.get("lang") === "he" ? "he" : "en";

  const missing = useMemo(() => {
    const issues: string[] = [];
    if (!systemId) issues.push("systemId");
    if (!userId) issues.push("userId");
    if (!isPlan(planRaw)) issues.push("plan (basic|standard|super)");
    if (!isHttpUrl(successUrl)) issues.push("success_url (https)");
    if (!isHttpUrl(cancelUrl)) issues.push("cancel_url (https)");
    return issues;
  }, [systemId, userId, planRaw, successUrl, cancelUrl]);

  const startCheckout = useCallback(async () => {
    if (missing.length) {
      setPhase("error");
      setError(`Missing or invalid: ${missing.join(", ")}`);
      return;
    }
    setPhase("loading");
    setError(null);
    try {
      const result = await createLightPbxCheckoutSession({
        plan: planRaw as LightPbxPlan,
        systemId,
        userId,
        successUrl,
        failureUrl: cancelUrl,
        lang,
      });
      const url = typeof result?.url === "string" ? result.url.trim() : "";
      if (!url.startsWith("https://")) {
        throw new Error("Checkout server returned no Stripe URL");
      }
      setPhase("redirecting");
      navigateToCheckout(url);
      // If still here after a moment, top navigation was blocked (e.g. sandboxed iframe).
      window.setTimeout(() => {
        setPhase("error");
        setError(
          "Could not leave this page to open Stripe. Base44 must open the pay URL as a full page (not a sandboxed iframe). Tap Open Stripe below, or change Base44 to window.location / top-level navigation.",
        );
      }, 2500);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Could not start Light PBX checkout");
    }
  }, [missing, planRaw, systemId, userId, successUrl, cancelUrl, lang]);

  useEffect(() => {
    void startCheckout();
  }, [startCheckout, attempt]);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Light PBX checkout</h1>

      {phase !== "error" && (
        <p style={{ color: "#475569" }}>
          {phase === "redirecting" ? "Opening Stripe…" : "Starting checkout…"}
        </p>
      )}

      {error && (
        <>
          <p style={{ color: "#b91c1c", whiteSpace: "pre-wrap" }}>{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            style={{
              marginTop: "1rem",
              padding: "0.6rem 1rem",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Retry checkout
          </button>
        </>
      )}

      <div
        style={{
          marginTop: "1.5rem",
          padding: "0.75rem 1rem",
          background: "#f8fafc",
          borderRadius: 8,
          fontSize: "0.8rem",
          color: "#64748b",
          wordBreak: "break-all",
        }}
      >
        <div>
          <strong>systemId:</strong> {systemId || "(missing)"}
        </div>
        <div>
          <strong>userId:</strong> {userId || "(missing)"}
        </div>
        <div>
          <strong>plan:</strong> {planRaw || "(missing)"}
        </div>
        <div>
          <strong>success_url:</strong> {successUrl || "(missing)"}
        </div>
        <div>
          <strong>cancel_url:</strong> {cancelUrl || "(missing)"}
        </div>
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "#64748b" }}>
        Base44 must open this URL as a <strong>full page</strong> (same tab or new tab), not inside a
        sandboxed iframe. Required query params: <code>systemId</code>, <code>userId</code>,{" "}
        <code>plan</code>, <code>success_url</code>, <code>cancel_url</code>.
      </p>
    </main>
  );
}
