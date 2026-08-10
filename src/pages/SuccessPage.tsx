import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import { Layout } from "../components/Layout";
import { getDb } from "../lib/firebase";
import { trackPurchase } from "../lib/analytics";
import { useLanguage } from "../contexts/LanguageContext";

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [provisioning, setProvisioning] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);
  const purchaseTracked = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }

    if (!purchaseTracked.current) {
      purchaseTracked.current = true;
      trackPurchase(sessionId);
    }

    // Watch incomingOrders/{session_id} for claim_token.
    // The executor writes it the moment provisioning completes.
    const db = getDb();
    const orderRef = doc(db, "incomingOrders", sessionId);

    const unsub = onSnapshot(
      orderRef,
      (snap) => {
        const data = snap.data();
        const token = data?.claim_token as string | undefined;
        if (token) {
          unsub();
          navigate(`/activate?token=${encodeURIComponent(token)}`, { replace: true });
        }
      },
      (err) => {
        // Firestore permission error or offline — stay on page, email fallback works.
        console.warn("[success] Firestore listener error:", err.message);
        setProvisioning(false);
      },
    );

    unsubRef.current = unsub;
    return () => unsub();
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
        <ConfirmedState
          provisioning={provisioning}
          onBack={() => navigate("/", { replace: true })}
        />
      </div>
    </Layout>
  );
}

function ConfirmedState({
  provisioning,
  onBack,
}: {
  provisioning: boolean;
  onBack: () => void;
}) {
  const { t, isRTL } = useLanguage();
  const copy = t.success;

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
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      <style>{`
        @keyframes secnum-bar-slide {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes secnum-bar-glow {
          0%, 100% { opacity: 0.45; box-shadow: 0 0 0 rgba(52, 211, 153, 0); }
          50% { opacity: 1; box-shadow: 0 0 22px rgba(52, 211, 153, 0.45); }
        }
        @keyframes secnum-pulse-ring {
          0% { transform: scale(0.92); opacity: 0.55; }
          70% { transform: scale(1.18); opacity: 0; }
          100% { transform: scale(1.18); opacity: 0; }
        }
      `}</style>

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
        <span
          style={{
            fontSize: "11.5px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "#34d399",
          }}
        >
          {copy.paymentConfirmed}
        </span>
      </motion.div>

      {/* Progress / email visual */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          width: provisioning ? "100%" : "80px",
          maxWidth: provisioning ? "280px" : undefined,
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        {provisioning ? (
          <>
            <div
              aria-hidden
              style={{
                position: "relative",
                width: "56px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "2px solid rgba(52,211,153,0.35)",
                  animation: "secnum-pulse-ring 1.8s ease-out infinite",
                }}
              />
              <span
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #6ee7b7, #059669)",
                  boxShadow: "0 0 18px rgba(52,211,153,0.55)",
                }}
              />
            </div>
            <div
              role="progressbar"
              aria-valuetext={copy.loading}
              aria-busy="true"
              style={{
                width: "100%",
                height: "8px",
                borderRadius: "99px",
                background: "rgba(52,211,153,0.12)",
                border: "1px solid rgba(52,211,153,0.22)",
                overflow: "hidden",
                position: "relative",
                animation: "secnum-bar-glow 2.4s ease-in-out infinite",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "42%",
                  borderRadius: "99px",
                  background:
                    "linear-gradient(90deg, transparent, #34d399 25%, #6ee7b7 50%, #34d399 75%, transparent)",
                  animation: "secnum-bar-slide 1.35s ease-in-out infinite",
                }}
              />
            </div>
          </>
        ) : (
          <div
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
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            ✉️
          </div>
        )}
      </motion.div>

      <h1
        style={{
          fontSize: "clamp(1.4rem, 5vw, 1.8rem)",
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.15,
          color: "var(--color-text)",
          marginBottom: "12px",
        }}
      >
        {provisioning ? copy.loading : copy.emailTitle}
      </h1>

      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.7,
          marginBottom: "28px",
          maxWidth: "340px",
        }}
      >
        {provisioning ? copy.loadingDesc : copy.emailDesc}
      </p>

      {!provisioning && (
        <div
          style={{
            width: "100%",
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-border)",
            borderRadius: "14px",
            padding: "4px 0",
            marginBottom: "24px",
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {copy.emailSteps.map(([icon, title, desc], i, arr) => (
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
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    margin: "0 0 2px",
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p
        style={{
          fontSize: "11.5px",
          color: "var(--color-text-muted)",
          opacity: 0.55,
          marginBottom: "20px",
          maxWidth: "320px",
        }}
      >
        {provisioning ? copy.loadingHint : copy.emailHint}
      </p>

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
        {copy.back}
      </button>
    </motion.div>
  );
}
