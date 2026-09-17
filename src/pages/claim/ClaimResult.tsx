import { motion } from "framer-motion";
import type { ActivateResponse } from "../../types";
import { formatIsraeliLocal } from "../../utils/format";
import { useLanguage } from "../../contexts/LanguageContext";

interface ClaimResultProps {
  data: ActivateResponse;
  label: string;
}

export function ClaimResult({ data, label }: ClaimResultProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      style={{ display: "flex", flexDirection: "column", gap: "28px" }}
    >
      {/* Check icon */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(52,211,153,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
          }}
        >
          ✓
        </motion.div>
      </div>

      {/* Message */}
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "clamp(1.75rem, 7vw, 2.25rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--color-text)",
            marginBottom: "10px",
          }}
        >
          {t.claim.successTitle}
        </h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--color-text-muted)" }}>
          {t.claim.successDesc}
        </p>
      </div>

      {/* Number card — LTR isolate so digits never reverse under Hebrew RTL */}
      <div
        style={{
          padding: "20px 22px",
          borderRadius: "16px",
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(52,211,153,0.2)",
        }}
      >
        <p
          style={{
            fontSize: "10.5px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(52,211,153,0.7)",
            marginBottom: "8px",
          }}
        >
          {t.claim.activeNumberLabel}
        </p>
        <p
          dir="ltr"
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "var(--color-text)",
            fontVariantNumeric: "tabular-nums",
            unicodeBidi: "isolate",
          }}
        >
          {formatIsraeliLocal(label)}
        </p>
        {data.name && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--color-text-muted)",
              marginTop: "6px",
            }}
          >
            {label}.{data.name}
          </p>
        )}
      </div>

      <p
        style={{
          fontSize: "12.5px",
          textAlign: "center",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
          whiteSpace: "pre-line",
        }}
      >
        {t.claim.successFooter}
      </p>
    </motion.div>
  );
}
