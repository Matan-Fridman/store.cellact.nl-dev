import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/Button";
import { ErrorAlert } from "../../components/ErrorAlert";
import { ClaimResult } from "./ClaimResult";
import { useClaim } from "../../hooks/useClaim";
import { formatIsraeliLocal } from "../../utils/format";
import { useLanguage } from "../../contexts/LanguageContext";
import type { ClaimParams } from "../../types";

interface ClaimCardProps {
  params: ClaimParams;
}

export function ClaimCard({ params }: ClaimCardProps) {
  const { status, step, data, error, errorKind, claim, reset } = useClaim();
  const { t } = useLanguage();

  const handleClaim = () => {
    claim(params.secret, params.label, params.web3identity);
  };

  if (status === "success" && data) {
    return <ClaimResult data={data} label={params.label} />;
  }

  const activeStepIndex = Math.max(0, Math.min(step - 1, 2));
  const alreadyActivated = status === "error" && errorKind === "already_activated";

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
          {t.claim.activationLabel}
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
          {t.claim.activateHeadlineA}
          <br />
          {t.claim.activateHeadlineB}
        </h1>
      </div>

      {/* Number display — force LTR so +972 / local digits don't reverse in Hebrew RTL */}
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
          {t.claim.yourNumber}
        </span>
        <span
          dir="ltr"
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "0.01em",
            fontVariantNumeric: "tabular-nums",
            unicodeBidi: "isolate",
          }}
        >
          {formatIsraeliLocal(params.label)}
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
              {t.claim.steps.map((_, i) => (
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

            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
              }}
            >
              {t.claim.steps[activeStepIndex]}…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error / already-activated */}
      {alreadyActivated ? (
        <div
          role="status"
          style={{
            borderRadius: "16px",
            padding: "18px 18px 16px",
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(52,211,153,0.28)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--color-text)",
              letterSpacing: "-0.02em",
            }}
          >
            {t.claim.alreadyActivatedTitle}
          </p>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "0.9rem",
              lineHeight: 1.55,
              color: "var(--color-text-muted)",
            }}
          >
            {t.claim.alreadyActivatedDesc}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              lineHeight: 1.5,
              color: "var(--color-text-muted)",
            }}
          >
            {t.claim.alreadyActivatedSupport.split("support@arnacon.com")[0]}
            <a
              href="mailto:support@arnacon.com"
              style={{ color: "#6ee7b7", fontWeight: 600, textDecoration: "underline" }}
            >
              support@arnacon.com
            </a>
            {t.claim.alreadyActivatedSupport.split("support@arnacon.com")[1] || ""}
          </p>
        </div>
      ) : (
        <ErrorAlert message={error} onDismiss={reset} />
      )}

      {/* CTA — hide retry when already activated (chain won't accept it again) */}
      {!alreadyActivated && (
        <Button
          onClick={handleClaim}
          loading={status === "loading"}
          disabled={status === "loading"}
          className="!py-4 !text-base"
        >
          {status === "loading"
            ? t.claim.steps[activeStepIndex]
            : status === "error"
            ? t.claim.retryBtn
            : t.claim.activateBtn}
        </Button>
      )}

      {status !== "loading" && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {t.claim.finePrint}
        </p>
      )}
    </div>
  );
}
