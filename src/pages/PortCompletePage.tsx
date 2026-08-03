import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { Layout } from "../components/Layout";
import { ErrorAlert } from "../components/ErrorAlert";
import { createCheckoutSession } from "../services/api";
import { getDb } from "../lib/firebase";
import {
  PORT_PACKAGE_ID,
  PORT_PACKAGE_NAME,
  PRICE_DISPLAY_AMOUNT,
  SUBSCRIPTION_PRICE,
  PRICE_CURRENCY,
} from "../config/constants";

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortedNumberDoc {
  number: string;
  walletAddress?: string;
  email?: string;
  status: string;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatDisplayNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("972") && digits.length === 12) {
    return `+972 ${digits.slice(3, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
  }
  return `+${digits}`;
}

function generateUserId(): string {
  return crypto.randomUUID();
}

function buildSuccessUrl(): string {
  return `${window.location.origin}/success`;
}

function buildFailureUrl(portDocId: string): string {
  return `${window.location.origin}/port/complete?id=${encodeURIComponent(portDocId)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Background() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(37,99,235,0.09) 0%, rgba(59,130,246,0.04) 50%, transparent 75%)",
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(142,45,226,0.06) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <motion.div {...fadeUp} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "2px solid rgba(59,130,246,0.2)",
          borderTopColor: "rgba(59,130,246,0.8)",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: "14px" }}>Loading your order…</p>
    </motion.div>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <motion.div {...fadeUp} style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
      <ErrorAlert message={message} />
      <button
        onClick={onBack}
        style={{
          marginTop: "20px",
          fontSize: "13px",
          color: "var(--color-text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        ← Go back
      </button>
    </motion.div>
  );
}

function ReadyState({
  portedDoc,
  onPay,
  paying,
  payError,
}: {
  portedDoc: PortedNumberDoc;
  onPay: () => void;
  paying: boolean;
  payError: string | null;
}) {
  const displayNumber = formatDisplayNumber(portedDoc.number);

  const features = [
    "Israeli mobile number, ready to receive calls & SMS",
    "Works with Arnacon — no physical SIM needed",
    "Up to 1,500 minutes / month",
    "Keep the same number you already have",
  ];

  return (
    <motion.div {...fadeUp} style={{ maxWidth: "480px", width: "100%" }}>
      {/* Badge */}
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(59,130,246,0.8)",
          marginBottom: "12px",
        }}
      >
        Number Porting · Final Step
      </p>

      {/* Title */}
      <h1
        style={{
          fontSize: "clamp(26px, 5vw, 36px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          color: "var(--color-text)",
          marginBottom: "10px",
        }}
      >
        Activate your number
      </h1>
      <p
        style={{
          fontSize: "15px",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
          marginBottom: "32px",
        }}
      >
        Your number has been verified. Complete the payment to activate it in Arnacon.
      </p>

      {/* Number pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(59,130,246,0.07)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: "12px",
          padding: "10px 20px",
          marginBottom: "28px",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Your number
        </span>
        <span
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--color-text)",
            fontFamily: "monospace",
            letterSpacing: "0.05em",
          }}
        >
          {displayNumber}
        </span>
      </div>

      {/* Plan card */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--color-text)",
                marginBottom: "2px",
              }}
            >
              {PORT_PACKAGE_NAME}
            </p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Full Arnacon subscription
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "2px" }}>
              €{PRICE_DISPLAY_AMOUNT} setup
            </p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text)" }}>
              €{SUBSCRIPTION_PRICE}
              <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--color-text-muted)" }}>
                {" "}/ mo
              </span>
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {features.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "1px",
                  fontSize: "9px",
                  color: "rgba(59,130,246,0.9)",
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                {f}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pay error */}
      {payError && (
        <div style={{ marginBottom: "16px" }}>
          <ErrorAlert message={payError} />
        </div>
      )}

      {/* CTA */}
      <div style={{ position: "relative", marginBottom: "12px" }}>
        {/* Gradient glow behind button */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-6px",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(142,45,226,0.25) 0%, rgba(196,91,255,0.2) 50%, rgba(255,88,176,0.15) 100%)",
            filter: "blur(10px)",
            opacity: paying ? 0.3 : 1,
            transition: "opacity 0.3s",
          }}
        />
        <button
          onClick={onPay}
          disabled={paying}
          style={{
            position: "relative",
            width: "100%",
            padding: "16px 32px",
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "#0e0e10",
            background: paying
              ? "rgba(230,230,230,0.5)"
              : "linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%)",
            border: "none",
            borderRadius: "12px",
            cursor: paying ? "not-allowed" : "pointer",
            transition: "opacity 0.2s, transform 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {paying ? (
            <>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: "2px solid rgba(0,0,0,0.2)",
                  borderTopColor: "#0e0e10",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Redirecting to checkout…
            </>
          ) : (
            "Pay & Activate →"
          )}
        </button>
      </div>

      {/* Fine print */}
      <p
        style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        €{PRICE_DISPLAY_AMOUNT} one-time setup · then €{SUBSCRIPTION_PRICE}/month · Cancel anytime
      </p>

      {/* Back link */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <a
          href="/port"
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
            textDecoration: "none",
            opacity: 0.7,
          }}
        >
          ← Back to porting
        </a>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PortCompletePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const portDocId = searchParams.get("id") ?? "";

  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [portedDoc, setPortedDoc] = useState<PortedNumberDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const fetchedRef = useRef(false);

  // Fetch the ported number document from Firestore
  useEffect(() => {
    if (!portDocId) {
      navigate("/port", { replace: true });
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        const db = getDb();
        const snap = await getDoc(doc(db, "portedNumbers", portDocId));
        if (!snap.exists()) {
          setLoadError("Porting order not found. Please check your email link or contact support.");
          setLoadStatus("error");
          return;
        }
        const data = snap.data() as PortedNumberDoc;
        if (!data.number) {
          setLoadError("Porting order is missing a number. Please contact support.");
          setLoadStatus("error");
          return;
        }
        setPortedDoc(data);
        setLoadStatus("ready");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load porting order";
        setLoadError(msg);
        setLoadStatus("error");
      }
    })();
  }, [portDocId, navigate]);

  const handlePay = useCallback(async () => {
    if (!portedDoc || paying) return;
    setPaying(true);
    setPayError(null);

    try {
      const { url } = await createCheckoutSession({
        packageId: PORT_PACKAGE_ID,
        packageName: PORT_PACKAGE_NAME,
        transactionPrice: PRICE_DISPLAY_AMOUNT,
        subscriptionPrice: SUBSCRIPTION_PRICE,
        currency: PRICE_CURRENCY,
        successUrl: buildSuccessUrl(),
        failureUrl: buildFailureUrl(portDocId),
        userId: generateUserId(),
        portDocId,
      });
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start checkout";
      setPayError(msg);
      setPaying(false);
    }
  }, [portedDoc, portDocId, paying]);

  return (
    <Layout>
      <Background />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "calc(100vh - 72px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px 60px",
        }}
      >
        <AnimatePresence mode="wait">
          {loadStatus === "loading" && <LoadingState key="loading" />}
          {loadStatus === "error" && (
            <ErrorState
              key="error"
              message={loadError ?? "Unknown error"}
              onBack={() => navigate("/port")}
            />
          )}
          {loadStatus === "ready" && portedDoc && (
            <ReadyState
              key="ready"
              portedDoc={portedDoc}
              onPay={handlePay}
              paying={paying}
              payError={payError}
            />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
