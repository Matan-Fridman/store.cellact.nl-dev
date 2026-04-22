import { motion } from "framer-motion";

export interface StepData {
  title: string;
  description: string;
}

interface StepCardProps {
  step: StepData;
  index: number;
}

/**
 * A single numbered step row — minimal, typographic, no card chrome.
 * Stagger-reveals on scroll.
 */
export function StepCard({ step, index }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.12 }}
      className="grid gap-4 py-9"
      style={{
        gridTemplateColumns: "56px 1fr 1.4fr",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {/* Step number — mono, very muted */}
      <span
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "var(--color-text-muted)",
          paddingTop: "3px",
          opacity: 0.55,
        }}
      >
        0{index + 1}
      </span>

      {/* Title */}
      <p
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--color-text)",
          lineHeight: 1.4,
        }}
      >
        {step.title}
      </p>

      {/* Description */}
      <p
        style={{
          fontSize: "0.9375rem",
          lineHeight: 1.65,
          color: "var(--color-text-muted)",
        }}
      >
        {step.description}
      </p>
    </motion.div>
  );
}
