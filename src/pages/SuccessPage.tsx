import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "../components/Layout";

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      navigate("/", { replace: true });
    }
  }, [sessionId, navigate]);

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
        <ConfirmedState onBack={() => navigate("/", { replace: true })} />
      </div>
    </Layout>
  );
}

function ConfirmedState({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
      style={{
        width: "100%",
        maxWidth: "440px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
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
          padding: "4px 14px",
          borderRadius: "99px",
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(52,211,153,0.22)",
          marginBottom: "28px",
        }}
      >
        <span style={{ fontSize: "12px", color: "#34d399" }}>✓</span>
        <span style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.05em", color: "#34d399" }}>
          Payment confirmed
        </span>
      </motion.div>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(1.6rem, 5vw, 2rem)",
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.1,
          color: "var(--color-text)",
          marginBottom: "16px",
        }}
      >
        Check your email
      </h1>

      {/* Envelope illustration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "20px",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
          marginBottom: "28px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}
      >
        ✉️
      </motion.div>

      <p
        style={{
          fontSize: "1rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.7,
          marginBottom: "32px",
          maxWidth: "360px",
        }}
      >
        Your number is being provisioned. You'll receive an activation link by
        email — click it to get your QR code and connect your number to Arnacon.
      </p>

      {/* Steps card */}
      <div
        style={{
          width: "100%",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border)",
          borderRadius: "14px",
          padding: "4px 0",
          marginBottom: "32px",
          textAlign: "left",
        }}
      >
        {(
          [
            ["📬", "Check your inbox", "Look for an email from Secnum by Cellact."],
            ["🔗", "Click the activation link", "It opens a page with your personal QR code."],
            ["📱", "Scan or tap to connect", "Open Arnacon and your number will be active."],
          ] as [string, string, string][]
        ).map(([icon, title, desc], i, arr) => (
          <div
            key={title}
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start",
              padding: "14px 24px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: 1.4, flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px" }}>
                {title}
              </p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>

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
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        ← Back to home
      </button>
    </motion.div>
  );
}
