import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/Button";
import { ErrorAlert } from "../../components/ErrorAlert";
import { ClaimResult } from "./ClaimResult";
import { useClaim } from "../../hooks/useClaim";
import { formatPhone } from "../../utils/format";
import type { ClaimParams } from "../../types";

const STEPS = [
  "Verifying your purchase",
  "Preparing your number",
  "Activating your number",
];

interface ClaimCardProps {
  params: ClaimParams;
}

export function ClaimCard({ params }: ClaimCardProps) {
  const { status, step, data, error, claim, reset } = useClaim();

  const handleClaim = () => {
    claim(params.secret, params.label, params.walletAddress);
  };

  // Success — replace entire card
  if (status === "success" && data) {
    return <ClaimResult data={data} label={params.label} />;
  }

  const activeStepIndex = Math.max(0, Math.min(step - 1, 2));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* Heading */}
      <div>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "#60a5fa",
            marginBottom: "14px",
          }}
        >
          Number Activation
        </p>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 7vw, 2.25rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--color-text)",
          }}
        >
          Activate your<br />Israeli number.
        </h1>
      </div>

      {/* Number display */}
      <div
        style={{
          padding: "18px 20px",
          borderRadius: "14px",
          background: "rgba(59,130,246,0.05)",
          border: "1px solid rgba(96,165,250,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          Your number
        </span>
        <span
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "0.01em",
          }}
        >
          {formatPhone(params.label)}
        </span>
      </div>

      {/* Step progress — only visible while loading */}
      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Progress bars */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: "3px",
                    borderRadius: "2px",
                    background:
                      i < activeStepIndex
                        ? "#3b82f6"
                        : i === activeStepIndex
                        ? "rgba(96,165,250,0.7)"
                        : "var(--color-border)",
                    transition: "background 0.4s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Animated shimmer on active bar */}
                  {i === activeStepIndex && (
                    <motion.div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                      }}
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Current step label */}
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
              }}
            >
              {STEPS[activeStepIndex]}…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <ErrorAlert message={error} onDismiss={reset} />

      {/* CTA */}
      <Button
        onClick={handleClaim}
        loading={status === "loading"}
        disabled={status === "loading"}
        className="!py-4 !text-base"
      >
        {status === "loading"
          ? STEPS[activeStepIndex]
          : status === "error"
          ? "Try Again"
          : "Activate Number"}
      </Button>

      {status !== "loading" && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          This will link your number to your device.
          <br />
          The process takes only a few seconds.
        </p>
      )}
    </div>
  );
}
