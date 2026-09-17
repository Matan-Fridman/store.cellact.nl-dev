import { useEffect, useMemo, useState } from "react";
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

/**
 * Base44 entrypoint: /lightpbx/pay?systemId=&userId=&plan=basic|standard|super
 * Optional: success_url, cancel_url (https). Defaults to VITE_LIGHTPBX_* staging placeholders.
 * Redirects to Stripe Checkout; on success Stripe returns to Base44 with session_id=cs_…
 */
export function LightPbxPayPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const systemId = (params.get("systemId") || params.get("system_id") || "").trim();
  const userId = (params.get("userId") || params.get("user_id") || "").trim();
  const planRaw = (params.get("plan") || "").trim().toLowerCase();
  const successUrl = (params.get("success_url") || params.get("successUrl") || LIGHTPBX_DEFAULT_SUCCESS_URL).trim();
  const cancelUrl = (params.get("cancel_url") || params.get("cancelUrl") || LIGHTPBX_DEFAULT_CANCEL_URL).trim();
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

  useEffect(() => {
    if (missing.length) {
      setError(`Missing or invalid: ${missing.join(", ")}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { url } = await createLightPbxCheckoutSession({
          plan: planRaw as LightPbxPlan,
          systemId,
          userId,
          successUrl,
          failureUrl: cancelUrl,
          lang,
        });
        if (!cancelled) window.location.href = url;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not start Light PBX checkout");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [missing, planRaw, systemId, userId, successUrl, cancelUrl, lang]);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Light PBX checkout</h1>
      {error ? (
        <p style={{ color: "#b91c1c" }}>{error}</p>
      ) : (
        <p style={{ color: "#475569" }}>Redirecting to Stripe…</p>
      )}
      <p style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "#64748b" }}>
        Base44 should open this page with <code>systemId</code>, <code>userId</code>, and{" "}
        <code>plan</code>. After payment, Stripe returns to your <code>success_url</code> with{" "}
        <code>session_id</code> (Stripe <code>cs_…</code>). Your backend then calls{" "}
        <code>lightpbx-config</code> <code>purchase</code> with web2 HMAC + that session id.
      </p>
    </main>
  );
}
