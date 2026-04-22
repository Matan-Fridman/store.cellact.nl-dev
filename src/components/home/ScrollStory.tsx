import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValueEvent,
} from "framer-motion";

// ─── Phone screen assets ─────────────────────────────────────────────────────
// Hero + one image per step. Replace step imports with phone-step-1.webp etc.
// when your screen-specific assets are ready — the crossfade is already wired.
import phoneHero from "../../assets/secnum-1.webp";
// TODO: replace each with the matching screen asset
import phoneStep1 from "../../assets/secnum-2.webp"; // phone-step-1.webp
import phoneStep2 from "../../assets/secnum-3.webp"; // phone-step-2.webp
import phoneStep3 from "../../assets/secnum-4.webp"; // phone-step-3.webp

import { Button } from "../Button";
import { ErrorAlert } from "../ErrorAlert";
import { PRICE_DISPLAY } from "../../config/constants";

const PHONE_SCREENS = [phoneHero, phoneStep1, phoneStep2, phoneStep3];

// ─── Story data ──────────────────────────────────────────────────────────────
const MOMENTS = [
  {
    step: null as string | null,
    eyebrow: "Israeli Mobile Numbers",
    headlineA: "A Secondary number,",
    headlineB: "on your existing phone.",
    sub: "Receive calls and SMS from anywhere in the world. Activate in minutes — no extra SIM required.",
    isHero: true,
  },
  {
    step: "01",
    eyebrow: null as string | null,
    headlineA: "Purchase your number",
    headlineB: "in 3 minutes.",
    sub: "No subscription. No contracts. Your number is reserved the moment you pay.",
    isHero: false,
  },
  {
    step: "02",
    eyebrow: null as string | null,
    headlineA: "Scan the QR code",
    headlineB: "with Arnacon.",
    sub: "Open the Arnacon app, scan the QR code, and your number activates instantly.",
    isHero: false,
  },
  {
    step: "03",
    eyebrow: null as string | null,
    headlineA: "Call and message",
    headlineB: "with your new number.",
    sub: "Your Israeli number is live. Make calls, send SMS — from anywhere in the world.",
    isHero: false,
  },
] as const;

// ─── Single moment panel ─────────────────────────────────────────────────────

interface MomentPanelProps {
  moment: (typeof MOMENTS)[number];
  onPurchase: () => void;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
}

function MomentPanel({
  moment,
  onPurchase,
  loading,
  error,
  onDismissError,
}: MomentPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-20% 0px -20% 0px" });

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        paddingLeft: "max(32px, calc((100vw - 1200px) / 2 + 32px))",
        paddingRight: "24px",
      }}
    >
      <div ref={ref} style={{ width: "min(46%, 500px)", minWidth: "280px" }}>
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 28 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Ghost step number — decorative, barely perceptible */}
          {moment.step && (
            <div
              aria-hidden
              style={{
                fontSize: "clamp(5.5rem, 12vw, 11rem)",
                fontWeight: 900,
                letterSpacing: "-0.055em",
                lineHeight: 0.88,
                color: "rgba(255,255,255,0.04)",
                marginBottom: "-0.06em",
                userSelect: "none",
              }}
            >
              {moment.step}
            </div>
          )}

          {/* Eyebrow — blue accent */}
          {moment.eyebrow && (
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "#60a5fa",
                marginBottom: "28px",
              }}
            >
              {moment.eyebrow}
            </p>
          )}

          {/* Headline */}
          <h2
            style={{
              fontSize: "clamp(2.5rem, 4vw, 4.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1.04,
              color: "var(--color-text)",
            }}
          >
            {moment.headlineA}
            <br />
            <span className="gradient-text">{moment.headlineB}</span>
          </h2>

          {/* Subtext */}
          <p
            style={{
              marginTop: "1.5rem",
              fontSize: "1.0625rem",
              lineHeight: 1.65,
              color: "var(--color-text-muted)",
              maxWidth: "36ch",
            }}
          >
            {moment.sub}
          </p>

          {/* CTA — hero only */}
          {moment.isHero && (
            <div
              style={{
                marginTop: "2.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <Button
                onClick={onPurchase}
                loading={loading}
                disabled={loading}
                fullWidth={false}
                className="!px-7"
              >
                {loading ? "Redirecting…" : `Get Your Number — ${PRICE_DISPLAY}`}
              </Button>

              <p style={{ fontSize: "12.5px", color: "var(--color-text-muted)" }}>
                One-time payment · No subscription · No extra SIM
              </p>

              <ErrorAlert message={error} onDismiss={onDismissError} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Scroll Story ─────────────────────────────────────────────────────────────

interface ScrollStoryProps {
  onPurchase: () => void;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
}

export function ScrollStory({
  onPurchase,
  loading,
  error,
  onDismissError,
}: ScrollStoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScreen, setActiveScreen] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Switch phone screen as user scrolls through each moment.
  // Container ≈ 435vh: 4×100vh panels + 35vh extra + sticky overhead.
  // Thresholds below keep each screen centered on its story moment.
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.24)       setActiveScreen(0);
    else if (latest < 0.47)  setActiveScreen(1);
    else if (latest < 0.70)  setActiveScreen(2);
    else                     setActiveScreen(3);
  });

  const phoneY       = useTransform(scrollYProgress, [0.72, 0.94], [0, -110]);
  const phoneOpacity = useTransform(scrollYProgress, [0.70, 0.92], [1, 0]);
  const phoneScale   = useTransform(scrollYProgress, [0, 0.75, 0.94], [1, 1, 0.94]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>

      {/* ── Sticky layer: phone + blue atmosphere ───────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Blue atmospheric light source — mirrors the phone glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 50% 60% at 74% 52%, rgba(37,99,235,0.1) 0%, transparent 65%)",
          }}
        />

        {/* Phone — pinned to right 54% */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "54%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div style={{ y: phoneY, opacity: phoneOpacity, scale: phoneScale }}>
            {/* Outer diffuse blue halo */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -54%)",
                width: "660px",
                height: "660px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #60a5fa 0%, #3b82f6 40%, #1d4ed8 70%, transparent 100%)",
                opacity: 0.1,
                filter: "blur(140px)",
              }}
            />
            {/* Inner concentrated blue core */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -54%)",
                width: "240px",
                height: "240px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #93c5fd 0%, #3b82f6 50%, #1d4ed8 80%, transparent 100%)",
                opacity: 0.3,
                filter: "blur(55px)",
              }}
            />

            {/* Phone with crossfading screens */}
            <div className="animate-float" style={{ position: "relative", zIndex: 10 }}>
              {/*
                Image 0 is position:static — sets container dimensions.
                Images 1-3 are position:absolute stacked exactly on top.
                All crossfade via opacity driven by activeScreen state.
              */}
              <div style={{ position: "relative", width: "clamp(300px, 38vw, 560px)" }}>
                {PHONE_SCREENS.map((src, i) => (
                  <motion.img
                    key={i}
                    src={src}
                    alt={i === 0 ? "Israeli mobile number on your phone" : ""}
                    animate={{ opacity: i === activeScreen ? 1 : 0 }}
                    transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      position: i === 0 ? "static" : "absolute",
                      top: i === 0 ? undefined : 0,
                      left: i === 0 ? undefined : 0,
                      width: "100%",
                      display: "block",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content panels — scroll over sticky phone ───────────────────────── */}
      <div style={{ marginTop: "-100vh", position: "relative", zIndex: 10 }}>
        {MOMENTS.map((moment, i) => (
          <MomentPanel
            key={i}
            moment={moment}
            onPurchase={onPurchase}
            loading={loading}
            error={error}
            onDismissError={onDismissError}
          />
        ))}
        <div style={{ height: "35vh" }} />
      </div>

    </div>
  );
}
