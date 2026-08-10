import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  dismissFbBanner,
  isFbBannerDismissed,
  shouldShowFacebookChrome,
} from "../../lib/campaign";
import { trackEvent } from "../../lib/analytics";

interface FacebookWelcomeBannerProps {
  onPurchase: () => void;
  loading: boolean;
}

/**
 * Soft welcome strip for Facebook campaign traffic — not a discount popup.
 * Aligns the ad promise (secondary number / no primary) with a direct checkout CTA.
 */
export function FacebookWelcomeBanner({
  onPurchase,
  loading,
}: FacebookWelcomeBannerProps) {
  const { t, isRTL } = useLanguage();
  const [visible, setVisible] = useState(false);
  const show = shouldShowFacebookChrome();

  useEffect(() => {
    if (!show || isFbBannerDismissed()) return;
    setVisible(true);
    void trackEvent("fb_welcome_impression");
  }, [show]);

  if (!show || !visible) return null;

  const copy = t.campaign.welcomeBanner;

  const dismiss = () => {
    setVisible(false);
    dismissFbBanner();
  };

  const handleCta = () => {
    void trackEvent("fb_welcome_click");
    onPurchase();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="region"
          aria-label={copy.title}
          style={{
            position: "fixed",
            top: "64px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            width: "min(560px, calc(100% - 24px))",
            direction: isRTL ? "rtl" : "ltr",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px 16px",
              borderRadius: "14px",
              background: "rgba(12,11,20,0.92)",
              border: "1px solid rgba(96,165,250,0.35)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--color-text)",
                }}
              >
                {copy.title}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12.5px",
                  lineHeight: 1.45,
                  color: "var(--color-text-muted)",
                }}
              >
                {copy.body}
              </p>
              <button
                type="button"
                onClick={handleCta}
                disabled={loading}
                style={{
                  marginTop: "12px",
                  border: "none",
                  cursor: loading ? "wait" : "pointer",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  color: "#fff",
                }}
              >
                {loading ? t.hero.ctaLoading : copy.cta}
              </button>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label={copy.dismiss}
              style={{
                flexShrink: 0,
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
