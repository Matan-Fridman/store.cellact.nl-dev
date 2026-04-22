import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "../components/Layout";
import { usePurchase } from "../hooks/usePurchase";
import { buildQrUrl } from "../utils/format";
import type { PurchaseResponse } from "../types";

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { status, data, error, completePurchase } = usePurchase();
  const calledRef = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }
    if (calledRef.current) return;
    calledRef.current = true;
    completePurchase(sessionId);
  }, [sessionId, completePurchase, navigate]);

  return (
    <Layout>
      <div
        style={{
          minHeight: "calc(100vh - 72px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        <AnimatePresence mode="wait">
          {status === "loading" && <LoadingState key="loading" />}
          {status === "success" && data && (
            <QRState key="qr" data={data} onBack={() => navigate("/", { replace: true })} />
          )}
          {status === "error" && (
            <ErrorState key="error" error={error} onBack={() => navigate("/", { replace: true })} />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
      <p
        style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--color-text)",
          marginBottom: "10px",
        }}
      >
        Preparing your number…
      </p>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        Payment received. We're reserving your Israeli number.
        <br />
        This usually takes just a few seconds.
      </p>
    </motion.div>
  );
}

// ─── QR Card ─────────────────────────────────────────────────────────────────

function QRState({ data, onBack }: { data: PurchaseResponse; onBack: () => void }) {
  const qrUrl = buildQrUrl(data.claimUrl, 280);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "100%",
        maxWidth: "420px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0",
      }}
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
          padding: "5px 14px",
          borderRadius: "99px",
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(52,211,153,0.22)",
          marginBottom: "24px",
        }}
      >
        <span style={{ fontSize: "12px", color: "#34d399" }}>✓</span>
        <span
          style={{
            fontSize: "11.5px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "#34d399",
          }}
        >
          Payment complete
        </span>
      </motion.div>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(1.75rem, 5vw, 2.25rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          color: "var(--color-text)",
          textAlign: "center",
          marginBottom: "12px",
        }}
      >
        Scan to activate<br />your number.
      </h1>
      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.65,
          textAlign: "center",
          marginBottom: "36px",
          maxWidth: "320px",
        }}
      >
        Open the <strong style={{ color: "var(--color-text)" }}>Arnacon</strong> app
        on your phone and scan this code to activate your Israeli number.
      </p>

      {/* QR Code frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", marginBottom: "32px" }}
      >
        {/* Outer glow */}
        <div
          style={{
            position: "absolute",
            inset: "-18px",
            borderRadius: "28px",
            background: "radial-gradient(ellipse at center, rgba(96,165,250,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* QR card */}
        <div
          style={{
            position: "relative",
            padding: "20px",
            borderRadius: "20px",
            background: "#ffffff",
            boxShadow: "0 0 0 1px rgba(96,165,250,0.2), 0 24px 48px rgba(0,0,0,0.4)",
          }}
        >
          {/* Corner decorations */}
          {[
            { top: 8, left: 8 },
            { top: 8, right: 8 },
            { bottom: 8, left: 8 },
            { bottom: 8, right: 8 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "18px",
                height: "18px",
                borderColor: "#3b82f6",
                borderStyle: "solid",
                borderTopWidth: pos.bottom !== undefined ? 0 : "2.5px",
                borderBottomWidth: pos.top !== undefined ? 0 : "2.5px",
                borderLeftWidth: pos.right !== undefined ? 0 : "2.5px",
                borderRightWidth: pos.left !== undefined ? 0 : "2.5px",
                borderRadius:
                  pos.top !== undefined && pos.left !== undefined
                    ? "4px 0 0 0"
                    : pos.top !== undefined && pos.right !== undefined
                    ? "0 4px 0 0"
                    : pos.bottom !== undefined && pos.left !== undefined
                    ? "0 0 0 4px"
                    : "0 0 4px 0",
                ...pos,
              }}
            />
          ))}

          <img
            src={qrUrl}
            alt="Scan to activate your number"
            width={240}
            height={240}
            style={{ display: "block" }}
          />
        </div>
      </motion.div>

      {/* Step guide */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        {["Open Arnacon", "Tap Scan", "Done"].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--color-text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </span>
            {i < 2 && (
              <span style={{ fontSize: "11px", color: "var(--color-border)", lineHeight: 1 }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "13px",
          color: "var(--color-text-muted)",
          padding: "4px 8px",
          borderRadius: "6px",
          transition: "color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        ← Back to store
      </button>
    </motion.div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorState({ error, onBack }: { error: string | null; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
      <p
        style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--color-text)",
          marginBottom: "10px",
        }}
      >
        Something went wrong
      </p>
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
          marginBottom: "28px",
        }}
      >
        {error ?? "We couldn't load your number. Please contact support if this persists."}
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
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        Back to Store
      </button>
    </motion.div>
  );
}
