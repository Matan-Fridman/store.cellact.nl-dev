import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createLightPbxCheckoutSession } from "../services/api";
import {
  LIGHTPBX_APP_URL,
  LIGHTPBX_PACKAGES,
  buildLightPbxCancelUrl,
  buildLightPbxSuccessUrl,
  parseLightPbxLang,
  resolveLightPbxPlan,
  type LightPbxLang,
  type LightPbxPlan,
} from "../config/constants";

const SESSION_PLACEHOLDER = "{CHECKOUT_SESSION_ID}";

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

function isAllowedLightPbxOrigin(origin: string): boolean {
  const allowed = new Set<string>([new URL(LIGHTPBX_APP_URL).origin, "http://localhost:3000"]);
  return allowed.has(origin);
}

/**
 * Optional ?success_url= / ?cancel_url= — only same origin as VITE_LIGHTPBX_APP_URL
 * (or localhost:3000) and pathname /billing/success|/billing/cancel. Rejects marketing `/`.
 * Always forces session_id={CHECKOUT_SESSION_ID} on success + systemId + lang.
 */
function resolveReturnUrl(
  kind: "success" | "cancel",
  rawOverride: string | null,
  systemId: string,
  lang: LightPbxLang,
): { url: string; rejected?: string } {
  const fallback =
    kind === "success"
      ? buildLightPbxSuccessUrl(systemId, lang)
      : buildLightPbxCancelUrl(systemId, lang);

  const raw = (rawOverride || "").trim();
  if (!raw) return { url: fallback };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { url: fallback, rejected: `invalid ${kind}_url` };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { url: fallback, rejected: `${kind}_url must be http(s)` };
  }

  if (!isAllowedLightPbxOrigin(parsed.origin)) {
    return {
      url: fallback,
      rejected: `${kind}_url origin not allowed (need ${new URL(LIGHTPBX_APP_URL).origin} or http://localhost:3000)`,
    };
  }

  const expectedPath = kind === "success" ? "/billing/success" : "/billing/cancel";
  if (parsed.pathname.replace(/\/$/, "") !== expectedPath) {
    return {
      url: fallback,
      rejected: `${kind}_url pathname must be ${expectedPath} (got ${parsed.pathname})`,
    };
  }

  // Rebuild query: keep caller extras, force required keys.
  parsed.searchParams.delete("session_id");
  parsed.searchParams.set("systemId", systemId);
  parsed.searchParams.set("lang", lang);

  if (kind === "success") {
    // Put session_id first with literal Stripe placeholder (unencoded braces).
    // Do NOT use URLSearchParams/URL.href for session_id — they emit %7B/%7D.
    const rest = parsed.searchParams.toString();
    const base = `${parsed.origin}${parsed.pathname}`;
    const withSession = `${base}?session_id=${SESSION_PLACEHOLDER}${rest ? `&${rest}` : ""}`;
    return { url: withSession };
  }

  return { url: parsed.toString() };
}

/**
 * Authenticated lightpbx-store dashboard entry:
 *   /lightpbx/refer?packageId=lightpbx_basic|…&systemId=&userId=&lang=en|he|nl
 * Aliases: plan|type|package|package_id; system_id|user_id.
 * /lightpbx/pay is the same page (backward compatible).
 */
export function LightPbxPayPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "redirecting" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  const systemId = (params.get("systemId") || params.get("system_id") || "").trim();
  const userId = (params.get("userId") || params.get("user_id") || "").trim();
  const lang = parseLightPbxLang(params.get("lang"));

  const planRaw =
    params.get("packageId") ||
    params.get("package_id") ||
    params.get("package") ||
    params.get("plan") ||
    params.get("type") ||
    "";
  const plan = resolveLightPbxPlan(planRaw);

  const successOverride =
    params.get("success_url") || params.get("successUrl") || null;
  const cancelOverride =
    params.get("cancel_url") || params.get("cancelUrl") || null;

  const successResolved = useMemo(
    () => resolveReturnUrl("success", successOverride, systemId, lang),
    [successOverride, systemId, lang],
  );
  const cancelResolved = useMemo(
    () => resolveReturnUrl("cancel", cancelOverride, systemId, lang),
    [cancelOverride, systemId, lang],
  );

  const successUrl = successResolved.url;
  const cancelUrl = cancelResolved.url;

  const missing = useMemo(() => {
    const issues: string[] = [];
    if (!systemId) issues.push("systemId");
    if (!userId) issues.push("userId");
    if (!plan) {
      issues.push(
        "packageId (lightpbx_basic|lightpbx_standard|lightpbx_super) or plan/type (basic|standard|super)",
      );
    }
    return issues;
  }, [systemId, userId, plan]);

  const startCheckout = useCallback(async () => {
    if (missing.length) {
      setPhase("error");
      setError(`Missing or invalid: ${missing.join(", ")}`);
      return;
    }
    const planId = plan as LightPbxPlan;
    setPhase("loading");
    setError(null);
    try {
      const result = await createLightPbxCheckoutSession({
        plan: planId,
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
          "Could not leave this page to open Stripe. Open the refer/pay URL as a full page (not a sandboxed iframe). Tap Retry, or use top-level navigation from the lightpbx-store dashboard.",
        );
      }, 2500);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Could not start Light PBX checkout");
    }
  }, [missing, plan, systemId, userId, successUrl, cancelUrl, lang]);

  useEffect(() => {
    void startCheckout();
  }, [startCheckout, attempt]);

  const packageLabel = plan ? LIGHTPBX_PACKAGES[plan].packageId : planRaw || "(missing)";
  const overrideNotes = [successResolved.rejected, cancelResolved.rejected]
    .filter(Boolean)
    .join("; ");

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
          <strong>packageId:</strong> {packageLabel}
        </div>
        <div>
          <strong>lang:</strong> {lang}
        </div>
        <div>
          <strong>success_url:</strong> {successUrl || "(missing)"}
        </div>
        <div>
          <strong>cancel_url:</strong> {cancelUrl || "(missing)"}
        </div>
        {overrideNotes ? (
          <div style={{ marginTop: "0.5rem", color: "#b45309" }}>
            Override ignored: {overrideNotes} — using store defaults.
          </div>
        ) : null}
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "#64748b" }}>
        Checkout starts from the authenticated lightpbx-store <strong>dashboard</strong> with known{" "}
        <code>systemId</code> + <code>userId</code>. Open{" "}
        <code>/lightpbx/refer</code> (or <code>/lightpbx/pay</code>) as a <strong>full page</strong>, not
        inside a sandboxed iframe. Required: <code>systemId</code>, <code>userId</code>, and a valid{" "}
        <code>packageId</code> / <code>plan</code>.
      </p>
    </main>
  );
}
