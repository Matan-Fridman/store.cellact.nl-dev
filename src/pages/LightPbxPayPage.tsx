import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createLightPbxCheckoutSession } from "../services/api";
import {
  LIGHTPBX_APP_URL,
  buildLightPbxCancelUrl,
  buildLightPbxSuccessUrl,
  parseLightPbxLang,
  resolveLightPbxPlan,
  type LightPbxLang,
  type LightPbxPlan,
} from "../config/constants";

const SESSION_PLACEHOLDER = "{CHECKOUT_SESSION_ID}";

/** Origins allowed for optional ?success_url= / ?cancel_url= overrides. */
const ALLOWED_LIGHTPBX_ORIGINS = new Set<string>([
  "https://app.lightpbx.com",
  "http://localhost:3000",
  "https://lightpbx-store.vercel.app",
]);

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
  if (ALLOWED_LIGHTPBX_ORIGINS.has(origin)) return true;
  try {
    return origin === new URL(LIGHTPBX_APP_URL).origin;
  } catch {
    return false;
  }
}

/**
 * Optional ?success_url= / ?cancel_url= — only allowlisted Light PBX origins
 * (app.lightpbx.com, localhost:3000, lightpbx-store.vercel.app) and pathname
 * /billing/success|/billing/cancel. Rejects marketing `/`.
 * Always forces session_id={CHECKOUT_SESSION_ID} on success + systemId + lang.
 */
function resolveReturnUrl(
  kind: "success" | "cancel",
  rawOverride: string | null,
  systemId: string,
  lang: LightPbxLang,
): { url: string } {
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
    return { url: fallback };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { url: fallback };
  }

  if (!isAllowedLightPbxOrigin(parsed.origin)) {
    return { url: fallback };
  }

  const expectedPath = kind === "success" ? "/billing/success" : "/billing/cancel";
  if (parsed.pathname.replace(/\/$/, "") !== expectedPath) {
    return { url: fallback };
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

function shortErrorMessage(err: unknown, missing: string[]): string {
  if (missing.length) {
    return "Missing checkout details. Please return to Light PBX and try again.";
  }
  const raw = err instanceof Error ? err.message : "";
  if (/no Stripe URL/i.test(raw)) {
    return "Could not start payment. Please try again.";
  }
  if (/Could not leave this page/i.test(raw) || /sandboxed iframe/i.test(raw)) {
    return "Could not open the payment page. Please try again.";
  }
  if (raw && raw.length < 120 && !/https?:\/\//i.test(raw) && !/\bcs_/i.test(raw)) {
    return raw;
  }
  return "Something went wrong. Please try again.";
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
    if (!plan) issues.push("packageId");
    return issues;
  }, [systemId, userId, plan]);

  const startCheckout = useCallback(async () => {
    if (missing.length) {
      setPhase("error");
      setError(shortErrorMessage(null, missing));
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
          shortErrorMessage(
            new Error("Could not leave this page to open Stripe (sandboxed iframe)."),
            [],
          ),
        );
      }, 2500);
    } catch (err) {
      setPhase("error");
      setError(shortErrorMessage(err, []));
    }
  }, [missing, plan, systemId, userId, successUrl, cancelUrl, lang]);

  useEffect(() => {
    void startCheckout();
  }, [startCheckout, attempt]);

  const logoSrc = `${import.meta.env.BASE_URL}favicon.png`;

  return (
    <main
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--color-bg, #f4f7fb)",
        color: "var(--color-text, #142033)",
        textAlign: "center",
      }}
    >
      <img
        src={logoSrc}
        alt="Cellact"
        width={56}
        height={56}
        style={{ borderRadius: 12, marginBottom: "1.25rem" }}
      />

      {phase !== "error" && (
        <>
          <div
            role="status"
            aria-label="Loading"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "3px solid #c7d7e8",
              borderTopColor: "var(--color-blue-600, #2563eb)",
              animation: "lightpbx-spin 0.8s linear infinite",
              marginBottom: "1rem",
            }}
          />
          <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 560, color: "var(--color-text, #142033)" }}>
            Redirecting to payment…
          </p>
          <style>{`@keyframes lightpbx-spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {phase === "error" && error && (
        <>
          <p
            style={{
              margin: "0 0 1.25rem",
              maxWidth: 360,
              fontSize: "1rem",
              lineHeight: 1.45,
              color: "#b91c1c",
            }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            style={{
              padding: "0.7rem 1.4rem",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(120deg, #60a5fa 0%, #2563eb 100%)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
            }}
          >
            Retry
          </button>
        </>
      )}
    </main>
  );
}
