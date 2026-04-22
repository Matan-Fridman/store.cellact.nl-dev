import { motion } from "framer-motion";
import { Button } from "../Button";
import { PRICE_DISPLAY } from "../../config/constants";
import { ErrorAlert } from "../ErrorAlert";

interface HeroCopyProps {
  onPurchase: () => void;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
}

const item = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const, delay },
});

export function HeroCopy({ onPurchase, loading, error, onDismissError }: HeroCopyProps) {
  return (
    <div className="flex flex-col gap-7">

      {/* Eyebrow */}
      <motion.p
        {...item(0.08)}
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
        }}
      >
        Israeli Mobile Numbers
      </motion.p>

      {/* Headline */}
      <motion.h1
        {...item(0.18)}
        style={{
          fontSize: "clamp(2.6rem, 4.2vw, 4.4rem)",
          fontWeight: 900,
          lineHeight: 1.04,
          letterSpacing: "-0.035em",
          color: "var(--color-text)",
        }}
      >
        A secondary number,{" "}
        <span className="gradient-text">on your existing phone.</span>
      </motion.h1>

      {/* Subtext — one sentence, nothing more */}
      <motion.p
        {...item(0.3)}
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.65,
          color: "var(--color-text-muted)",
          maxWidth: "38ch",
        }}
      >
        Receive calls and SMS on a real Israeli number from anywhere
        in the world. Activate in minutes — no extra SIM required.
      </motion.p>

      {/* CTA */}
      <motion.div {...item(0.42)} className="flex flex-col gap-3.5">
        {/* Gradient ring frames the button per brand rules */}
        <div
          style={{
            display: "inline-flex",
            borderRadius: "12px",
            padding: "1px",
            background: "linear-gradient(135deg, #8E2DE2, #FF58B0)",
            width: "fit-content",
          }}
        >
          <Button
            onClick={onPurchase}
            loading={loading}
            disabled={loading}
            className="!w-auto !rounded-[11px] !px-7"
          >
            {loading ? "Redirecting…" : `Get Your Number — ${PRICE_DISPLAY}`}
          </Button>
        </div>

        {/* Inline proof — replaces checkmark list */}
        <p style={{ fontSize: "12.5px", color: "var(--color-text-muted)", letterSpacing: "0.01em" }}>
          One-time payment &nbsp;·&nbsp; No subscription &nbsp;·&nbsp; No extra SIM
        </p>

        <ErrorAlert message={error} onDismiss={onDismissError} />
      </motion.div>

    </div>
  );
}
