import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
  useInView,
  useMotionValueEvent,
} from "framer-motion";

// ─── Phone screen assets ─────────────────────────────────────────────────────
import phoneHero  from "../../assets/secnum-1.webp";
import phoneStep1 from "../../assets/secnum-2.webp";
import phoneStep2 from "../../assets/secnum-3.webp";
import phoneStep3 from "../../assets/secnum-4.webp";

import { Button } from "../Button";
import { ErrorAlert } from "../ErrorAlert";
import { PRICE_DISPLAY } from "../../config/constants";
import { useLanguage } from "../../contexts/LanguageContext";

const PHONE_SCREENS = [phoneHero, phoneStep1, phoneStep2, phoneStep3];

// ─── Moment shape (built at runtime from translations) ───────────────────────

interface Moment {
  step: string | null;
  eyebrow: string | null;
  headlineA: string;
  headlineB: string;
  sub: string;
  isHero: boolean;
}

// ─── Single moment panel ─────────────────────────────────────────────────────

interface MomentPanelProps {
  moment: Moment;
  isRTL: boolean;
  onPurchase: () => void;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
}

function MomentPanel({
  moment,
  isRTL,
  onPurchase,
  loading,
  error,
  onDismissError,
}: MomentPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-20% 0px -20% 0px" });
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        // In RTL the phone is on the left, so content padding flips
        paddingInlineStart: "max(32px, calc((100vw - 1200px) / 2 + 32px))",
        paddingInlineEnd: "24px",
      }}
    >
      <div ref={ref} style={{ width: "min(46%, 500px)", minWidth: "280px" }}>
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 28 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] as const }}
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
                color: "rgba(255,255,255,0.1)",
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
              letterSpacing: isRTL ? "-0.01em" : "-0.035em",
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
                {loading ? t.hero.ctaLoading : t.hero.cta(PRICE_DISPLAY)}
              </Button>

              <p style={{ fontSize: "12.5px", color: "var(--color-text-muted)" }}>
                {t.hero.finePrint}
              </p>

              {/* Port link — temporarily disabled */}
              {/* <button
                type="button"
                onClick={() => navigate("/port")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.01em",
                  padding: 0,
                  textAlign: "left",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
              >
                Already have an Israeli number?{" "}
                <span style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>
                  Port it to Arnacon →
                </span>
              </button> */}

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
  const [showStickyBtn, setShowStickyBtn] = useState(false);
  const { t, isRTL } = useLanguage();

  // Build story panels from translations
  const moments: Moment[] = [
    {
      step: null,
      eyebrow: t.hero.eyebrow,
      headlineA: t.hero.headlineA,
      headlineB: t.hero.headlineB,
      sub: t.hero.sub,
      isHero: true,
    },
    ...t.steps.map((s) => ({
      step: s.step,
      eyebrow: null,
      headlineA: s.headlineA,
      headlineB: s.headlineB,
      sub: s.sub,
      isHero: false,
    })),
  ];

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

    // Show sticky CTA once hero panel scrolls away; hide again as phone exits
    setShowStickyBtn(latest > 0.17 && latest < 0.88);
  });

  const phoneY       = useTransform(scrollYProgress, [0.72, 0.94], [0, -110]);
  const phoneOpacity = useTransform(scrollYProgress, [0.70, 0.92], [1, 0]);
  const phoneScale   = useTransform(scrollYProgress, [0, 0.75, 0.94], [1, 1, 0.94]);

  // ── Scroll-reactive transforms ──────────────────────────────────────────────
  // Velocity tilt: fast downscroll → phone leans back (rotateX), like inertia.
  // Low velocity threshold so normal scrolling triggers it, not just fast flicks.
  const { scrollY } = useScroll();
  const rawVelocity     = useVelocity(scrollY);
  const velocityRotateX = useTransform(rawVelocity, [-1000, 0, 1000], [16, 0, -16]);
  const smoothRotateX   = useSpring(velocityRotateX, { stiffness: 70, damping: 16, mass: 0.5 });

  // Per-step rotateY: phone faces each story beat — wide swing per panel.
  const rawRotateY = useTransform(
    scrollYProgress,
    [0,    0.24,  0.47, 0.70,  1.0],
    [5,    -10,   6,    -8,    0],
  );
  const smoothRotateY = useSpring(rawRotateY, { stiffness: 45, damping: 18, mass: 0.7 });

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
            background: isRTL
              ? "radial-gradient(ellipse 50% 60% at 26% 52%, rgba(37,99,235,0.1) 0%, transparent 65%)"
              : "radial-gradient(ellipse 50% 60% at 74% 52%, rgba(37,99,235,0.1) 0%, transparent 65%)",
          }}
        />

        {/* Phone — pinned to the side opposite content (right in LTR, left in RTL) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            ...(isRTL ? { left: 0 } : { right: 0 }),
            width: "54%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Scroll-driven exit wrapper */}
          <motion.div style={{ y: phoneY, opacity: phoneOpacity, scale: phoneScale }}>

            {/* Outer diffuse halo — breathes slowly */}
            <motion.div
              aria-hidden
              animate={{ opacity: [0.09, 0.17, 0.09], scale: [1, 1.14, 1] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "660px",
                height: "660px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #60a5fa 0%, #3b82f6 40%, #1d4ed8 70%, transparent 100%)",
                filter: "blur(140px)",
                translateX: "-50%",
                translateY: "-54%",
              }}
            />

            {/* Inner concentrated core — pulses faster */}
            <motion.div
              aria-hidden
              animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.22, 1] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "240px",
                height: "240px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #93c5fd 0%, #3b82f6 50%, #1d4ed8 80%, transparent 100%)",
                filter: "blur(55px)",
                translateX: "-50%",
                translateY: "-54%",
              }}
            />

            {/*
              Perspective container — enables 3D transforms on children.
              Float + scroll-reactive rotateX/rotateY live here together.
            */}
            {/*
              Perspective container — required for rotateX/rotateY to render in 3D.
              The phone only moves in reaction to scroll; no autonomous animation.
            */}
            <div style={{ perspective: "900px", position: "relative", zIndex: 10 }}>
              <motion.div style={{ rotateX: smoothRotateX, rotateY: smoothRotateY }}>
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
                      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] as const }}
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
              </motion.div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* ── Content panels — scroll over sticky phone ───────────────────────── */}
      <div style={{ marginTop: "-100vh", position: "relative", zIndex: 10 }}>
        {moments.map((moment, i) => (
          <MomentPanel
            key={i}
            moment={moment}
            isRTL={isRTL}
            onPurchase={onPurchase}
            loading={loading}
            error={error}
            onDismissError={onDismissError}
          />
        ))}
        <div style={{ height: "35vh" }} />
      </div>

      {/* ── Sticky purchase button ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showStickyBtn && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            style={{
              position: "fixed",
              bottom: "32px",
              right: "32px",
              zIndex: 100,
              pointerEvents: "auto",
            }}
          >
            {/* Subtle glow halo behind the button */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-12px",
                borderRadius: "20px",
                background:
                  "radial-gradient(ellipse at center, rgba(96,165,250,0.18) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <Button
              onClick={onPurchase}
              loading={loading}
              disabled={loading}
              fullWidth={false}
              className="!px-5 !py-3 !text-sm relative"
            >
              {loading ? t.hero.ctaLoading : t.hero.cta(PRICE_DISPLAY)}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
