import { useEffect, useRef, useState } from "react";
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
import { useLanguage } from "../../contexts/LanguageContext";
import {
  isFacebookTraffic,
  shouldShowConversionLanding,
} from "../../lib/campaign";

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
  ctaLabel: string;
  ctaLoading: string;
  finePrint: string;
}

function MomentPanel({
  moment,
  isRTL,
  onPurchase,
  loading,
  error,
  onDismissError,
  ctaLabel,
  ctaLoading,
  finePrint,
}: MomentPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-20% 0px -20% 0px" });
  // const navigate = useNavigate();

  return (
    <div
      className={`scroll-story-panel${moment.isHero ? " scroll-story-panel--hero" : ""}`}
    >
      <div ref={ref} className="scroll-story-copy">
        <motion.div
          className="scroll-story-copy-inner"
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 28 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {/* Ghost step number — decorative, barely perceptible */}
          {moment.step && (
            <div
              aria-hidden
              className="scroll-story-step"
            >
              {moment.step}
            </div>
          )}

          {/* Eyebrow — blue accent */}
          {moment.eyebrow && (
            <p
              className="scroll-story-eyebrow"
            >
              {moment.eyebrow}
            </p>
          )}

          {/* Headline */}
          <h2
            className="scroll-story-headline"
            style={{
              letterSpacing: isRTL ? "-0.01em" : "-0.035em",
            }}
          >
            {moment.headlineA}
            <br />
            <span className="gradient-text">{moment.headlineB}</span>
          </h2>

          {/* Subtext */}
          <p
            className="scroll-story-subtext"
          >
            {moment.sub}
          </p>
        </motion.div>

          {/* CTA — hero only */}
          {moment.isHero && (
            <div
              className="scroll-story-cta"
            >
              <Button
                onClick={onPurchase}
                loading={loading}
                disabled={loading}
                fullWidth={false}
                className="!px-7"
              >
                {loading ? ctaLoading : ctaLabel}
              </Button>

              <p style={{ fontSize: "12.5px", color: "var(--color-text-muted)" }}>
                {finePrint}
              </p>

              <ErrorAlert message={error} onDismiss={onDismissError} />
            </div>
          )}
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
  /** FB ad landings: hero-only — no multi-screen scroll theater */
  compact?: boolean;
}

export function ScrollStory({
  onPurchase,
  loading,
  error,
  onDismissError,
  compact = false,
}: ScrollStoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScreen, setActiveScreen] = useState(0);
  // FB compact: never use sticky CTA — it stacks on the offer card.
  const [showStickyBtn, setShowStickyBtn] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;
  const { t, isRTL } = useLanguage();
  const conversion = shouldShowConversionLanding();
  const hero = conversion ? t.campaignHero : t.hero;
  const steps = conversion ? t.campaignSteps : t.steps;
  const ctaLabel = hero.cta;
  const fbCompact = compact || isFacebookTraffic();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (fbCompact) {
      document.documentElement.dataset.fbLand = "1";
      setShowStickyBtn(false);
      return () => {
        delete document.documentElement.dataset.fbLand;
      };
    }
  }, [fbCompact]);

  // Build story panels from translations
  const moments: Moment[] = [
    {
      step: null,
      eyebrow: hero.eyebrow,
      headlineA: hero.headlineA,
      headlineB: hero.headlineB,
      sub: hero.sub,
      isHero: true,
    },
    // FB traffic: one decision screen. Extra panels are where impulse dies.
    ...(fbCompact
      ? []
      : steps.map((s) => ({
          step: s.step,
          eyebrow: null,
          headlineA: s.headlineA,
          headlineB: s.headlineB,
          sub: s.sub,
          isHero: false,
        }))),
  ];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Switch phone screen as user scrolls through each moment.
  // Container ≈ 435vh: 4×100vh panels + 35vh extra + sticky overhead.
  // Thresholds below keep each screen centered on its story moment.
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (fbCompact) {
      setActiveScreen(0);
      setShowStickyBtn(false);
      return;
    }

    if (latest < 0.24)       setActiveScreen(0);
    else if (latest < 0.47)  setActiveScreen(1);
    else if (latest < 0.70)  setActiveScreen(2);
    else                     setActiveScreen(3);

    // Show sticky CTA once hero panel scrolls away; hide again as phone exits
    setShowStickyBtn(latest > 0.17 && latest < 0.88);
  });

  const phoneY     = useTransform(scrollYProgress, [0.72, 0.94], [0, -110]);
  const phoneScale = useTransform(scrollYProgress, [0, 0.75, 0.94], [1, 1, 0.94]);

  // Desktop: stay opaque until the late exit fade.
  // Mobile: dim hard once the first step arrives so copy stays readable over the phone.
  const phoneOpacity = useTransform(scrollYProgress, (progress) => {
    // Compact FB land has ~0 scroll range — progress often reads as 1 and
    // used to fade the phone out completely. Keep it fully visible.
    if (fbCompact) return 1;

    let opacity = 1;
    if (progress >= 0.92) opacity = 0;
    else if (progress > 0.7) opacity = 1 - (progress - 0.7) / 0.22;

    if (isMobileRef.current) {
      if (progress >= 0.24) opacity *= 0.18;
      else if (progress > 0.17) {
        const t = (progress - 0.17) / 0.07;
        opacity *= 1 - t * 0.82; // 1 → 0.18
      }
    }

    return opacity;
  });

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
    <div ref={containerRef} className="scroll-story">

      {/* ── Sticky layer: phone + blue atmosphere ───────────────────────────── */}
      <div
        className="scroll-story-sticky"
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
          className={`scroll-story-phone-stage${isRTL ? " scroll-story-phone-stage--rtl" : ""}`}
        >
          {/* Scroll-driven exit wrapper — static on FB compact so phone stays visible */}
          <motion.div
            style={
              fbCompact
                ? { opacity: 1, y: 0, scale: 1 }
                : { y: phoneY, opacity: phoneOpacity, scale: phoneScale }
            }
          >
            {/* Mobile: dim phone once past hero so step copy stays readable */}
            <motion.div
              animate={{
                opacity: !fbCompact && isMobile && activeScreen >= 1 ? 0.18 : 1,
              }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] as const }}
            >

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
            <div className="scroll-story-phone-float" style={{ perspective: "900px", position: "relative", zIndex: 10 }}>
              <motion.div style={{ rotateX: smoothRotateX, rotateY: smoothRotateY }}>
                {/*
                  Image 0 is position:static — sets container dimensions.
                  Images 1-3 are position:absolute stacked exactly on top.
                  All crossfade via opacity driven by activeScreen state.
                */}
                <div className="scroll-story-phone-art">
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
          </motion.div>
        </div>
      </div>

      {/* ── Content panels — scroll over sticky phone ───────────────────────── */}
      <div className="scroll-story-panels">
        {moments.map((moment, i) => (
          <MomentPanel
            key={i}
            moment={moment}
            isRTL={isRTL}
            onPurchase={onPurchase}
            loading={loading}
            error={error}
            onDismissError={onDismissError}
            ctaLabel={ctaLabel}
            ctaLoading={hero.ctaLoading}
            finePrint={hero.finePrint}
          />
        ))}
        {!fbCompact && <div style={{ height: "35vh" }} />}
      </div>

      {/* ── Sticky purchase button ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showStickyBtn && (
          <motion.div
            className="scroll-story-sticky-cta"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
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
              className="!px-5 !py-3 !text-sm relative scroll-story-sticky-cta-btn"
            >
              {loading ? hero.ctaLoading : ctaLabel}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
