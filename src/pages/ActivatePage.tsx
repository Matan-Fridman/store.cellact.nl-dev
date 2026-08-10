import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "../components/Layout";
import { redeemActivationToken } from "../services/api";
import { buildQrUrl, formatIsraeliLocal } from "../utils/format";
import { useLanguage } from "../contexts/LanguageContext";

type State =
  | { phase: "loading" }
  | { phase: "ready"; claimUrl: string; label: string }
  | { phase: "error"; message: string };

export function ActivatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const calledRef = useRef(false);
  const [state, setState] = useState<State>({ phase: "loading" });

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    if (calledRef.current) return;
    calledRef.current = true;

    redeemActivationToken(token)
      .then(({ claimUrl, label }) => setState({ phase: "ready", claimUrl, label }))
      .catch((err: Error) =>
        setState({ phase: "error", message: err.message || "Invalid activation link." }),
      );
  }, [token, navigate]);

  return (
    <Layout>
      <div
        style={{
          minHeight: "calc(100vh - 72px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 24px",
        }}
      >
        <AnimatePresence mode="wait">
          {state.phase === "loading" && <LoadingState key="loading" t={t} />}
          {state.phase === "ready" && (
            <QRState
              key="qr"
              claimUrl={state.claimUrl}
              label={state.label}
              onBack={() => navigate("/", { replace: true })}
              t={t}
            />
          )}
          {state.phase === "error" && (
            <ErrorState
              key="error"
              message={state.message}
              onBack={() => navigate("/", { replace: true })}
              t={t}
            />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingState({ t }: { t: ReturnType<typeof useLanguage>["t"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      style={{ textAlign: "center", maxWidth: "400px" }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          margin: "0 auto 28px",
          borderRadius: "16px",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: "2.5px solid rgba(96,165,250,0.25)",
            borderTopColor: "#60a5fa",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
      <p style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-text)", marginBottom: "10px" }}>
        {t.success.loading}
      </p>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        {t.success.loadingDesc}
      </p>
    </motion.div>
  );
}

// ─── QR Card ─────────────────────────────────────────────────────────────────

function QRState({
  claimUrl,
  label,
  onBack,
  t,
}: {
  claimUrl: string;
  label: string;
  onBack: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const qrUrl = buildQrUrl(claimUrl, 200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
      style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          padding: "4px 12px",
          borderRadius: "99px",
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(52,211,153,0.22)",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "12px", color: "#34d399" }}>✓</span>
        <span style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.05em", color: "#34d399" }}>
          Ready to activate
        </span>
      </motion.div>

      <h1
        style={{
          fontSize: "clamp(1.4rem, 5vw, 1.75rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          color: "var(--color-text)",
          textAlign: "center",
          marginBottom: "8px",
        }}
      >
        {t.success.scanTitle} {t.success.scanTitleB}
      </h1>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.5,
          textAlign: "center",
          marginBottom: "16px",
          maxWidth: "300px",
        }}
        dangerouslySetInnerHTML={{
          __html: t.success.scanDesc("Arnacon").replace(
            "Arnacon",
            "<strong style=\"color:var(--color-text)\">Arnacon</strong>",
          ),
        }}
      />

      {label && (
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            background: "rgba(96,165,250,0.07)",
            border: "1px solid rgba(96,165,250,0.18)",
            borderRadius: "10px",
            padding: "8px 20px",
            marginBottom: "14px",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t.claim.yourNumber}
          </span>
          <span
            dir="ltr"
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--color-text)",
              fontFamily: "monospace",
              unicodeBidi: "isolate",
            }}
          >
            {formatIsraeliLocal(label)}
          </span>
        </div>
      )}

      {/* QR Code frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
        style={{ position: "relative", marginBottom: "16px" }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-14px",
            borderRadius: "24px",
            background: "radial-gradient(ellipse at center, rgba(96,165,250,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            padding: "14px",
            borderRadius: "16px",
            background: "#ffffff",
            boxShadow: "0 0 0 1px rgba(96,165,250,0.2), 0 16px 40px rgba(0,0,0,0.35)",
          }}
        >
          {[
            { top: 6, left: 6 }, { top: 6, right: 6 },
            { bottom: 6, left: 6 }, { bottom: 6, right: 6 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "14px",
                height: "14px",
                borderColor: "#3b82f6",
                borderStyle: "solid",
                borderTopWidth:    pos.bottom !== undefined ? 0 : "2px",
                borderBottomWidth: pos.top    !== undefined ? 0 : "2px",
                borderLeftWidth:   pos.right  !== undefined ? 0 : "2px",
                borderRightWidth:  pos.left   !== undefined ? 0 : "2px",
                borderRadius:
                  pos.top !== undefined && pos.left  !== undefined ? "4px 0 0 0"
                : pos.top !== undefined && pos.right !== undefined ? "0 4px 0 0"
                : pos.bottom !== undefined && pos.left  !== undefined ? "0 0 0 4px"
                : "0 0 4px 0",
                ...pos,
              }}
            />
          ))}
          <img src={qrUrl} alt="Scan to activate your number" width={180} height={180} style={{ display: "block" }} />
        </div>
      </motion.div>

      {/* Steps */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "16px" }}>
        {t.success.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{s}</span>
            {i < 2 && <span style={{ fontSize: "10px", color: "var(--color-border)", lineHeight: 1 }}>→</span>}
          </div>
        ))}
      </div>

      {/* — or — */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", marginBottom: "12px" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
        <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
          {t.success.orDivider}
        </span>
        <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
      </div>

      {/* Open on this device */}
      <button
        type="button"
        onClick={() => { window.location.href = claimUrl; }}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: "12px",
          border: "1px solid rgba(142,45,226,0.35)",
          background: "rgba(142,45,226,0.08)",
          color: "var(--color-text)",
          fontSize: "0.9375rem",
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "-0.01em",
          transition: "background 0.2s, border-color 0.2s",
          marginBottom: "10px",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(142,45,226,0.16)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(142,45,226,0.55)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(142,45,226,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(142,45,226,0.35)"; }}
      >
        {t.success.installOnDevice}
      </button>

      <button
        type="button"
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-text-muted)", padding: "4px 8px", borderRadius: "6px", transition: "color 0.2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        {t.success.back}
      </button>
    </motion.div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onBack,
  t,
}: {
  message: string;
  onBack: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      style={{ textAlign: "center", maxWidth: "400px" }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          margin: "0 auto 24px",
          borderRadius: "16px",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
        }}
      >
        ⚠️
      </div>
      <p style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-text)", marginBottom: "10px" }}>
        {t.success.errorTitle}
      </p>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "28px" }}>
        {message}
      </p>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border)",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--color-text)",
          padding: "11px 24px",
          borderRadius: "10px",
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {t.success.errorBack}
      </button>
    </motion.div>
  );
}
