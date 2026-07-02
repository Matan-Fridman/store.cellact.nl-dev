import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "../Button";
import { PRICE_DISPLAY } from "../../config/constants";
import { useLanguage } from "../../contexts/LanguageContext";

interface BottomCtaProps {
  onPurchase: () => void;
  loading: boolean;
}

export function BottomCta({ onPurchase, loading }: BottomCtaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px" });
  const { t, isRTL } = useLanguage();
  // const navigate = useNavigate();

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "160px 24px 180px",
        textAlign: "center",
      }}
    >
      {/* Single centered glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          height: "900px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #3b82f6 0%, #2563eb 35%, #1d4ed8 65%, transparent 80%)",
          opacity: 0.07,
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      {/* Descending line from marquee */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1px",
          height: "80px",
          background:
            "linear-gradient(to bottom, var(--color-border), rgba(196,91,255,0.3), transparent)",
        }}
      />

      <div ref={ref} style={{ position: "relative", zIndex: 10, maxWidth: "600px", margin: "0 auto" }}>
        <motion.h2
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 32 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          style={{
            fontSize: "clamp(2.75rem, 5vw, 5rem)",
            fontWeight: 900,
            letterSpacing: isRTL ? "-0.01em" : "-0.04em",
            lineHeight: 1.02,
            color: "var(--color-text)",
            marginBottom: "1.25rem",
          }}
        >
          {t.bottomCta.headlineA}
          <br />
          <span className="gradient-text" style={{ fontStyle: "normal" }}>
            {t.bottomCta.headlineB}
          </span>
        </motion.h2>

        <motion.p
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: 0.1 }}
          style={{
            fontSize: "1.0625rem",
            lineHeight: 1.65,
            color: "var(--color-text-muted)",
            marginBottom: "2.75rem",
            maxWidth: "34ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {t.bottomCta.sub}
        </motion.p>

        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 16 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: 0.18 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
        >
          <Button
            onClick={onPurchase}
            loading={loading}
            disabled={loading}
            fullWidth={false}
            className="!px-8 !py-4 !text-base"
          >
            {loading ? t.bottomCta.ctaLoading : t.bottomCta.cta(PRICE_DISPLAY)}
          </Button>

          {/* App store badges */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "8px" }}>
            <a
              href="https://apps.apple.com/app/arnacon/id6504406464"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 18px",
                borderRadius: "12px",
                background: "#000",
                border: "1px solid rgba(255,255,255,0.12)",
                textDecoration: "none",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.28)"; (e.currentTarget as HTMLAnchorElement).style.background = "#111"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLAnchorElement).style.background = "#000"; }}
            >
              {/* Apple logo */}
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" width="18" height="22" style={{ filter: "invert(1)" }} alt="Apple" />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", lineHeight: 1 }}>Download on the</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", lineHeight: 1.3, letterSpacing: "-0.01em" }}>App Store</div>
              </div>
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.arnacon.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 18px",
                borderRadius: "12px",
                background: "#000",
                border: "1px solid rgba(255,255,255,0.12)",
                textDecoration: "none",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.28)"; (e.currentTarget as HTMLAnchorElement).style.background = "#111"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLAnchorElement).style.background = "#000"; }}
            >
              {/* Google Play logo */}
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" width="20" height="20" alt="Google Play" />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", lineHeight: 1 }}>Get it on</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", lineHeight: 1.3, letterSpacing: "-0.01em" }}>Google Play</div>
              </div>
            </a>
          </div>

          {/* Port existing number link — temporarily disabled */}
          {/* <button
            type="button"
            onClick={() => navigate("/port")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "13.5px",
              color: "var(--color-text-muted)",
              letterSpacing: "0.01em",
              transition: "color 0.2s",
              padding: "2px 6px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          >
            Already have an Israeli number?{" "}
            <span style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Port it to Arnacon →
            </span>
          </button> */}
        </motion.div>
      </div>
    </section>
  );
}
