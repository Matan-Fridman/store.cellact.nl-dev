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
 * Centered modal for Facebook ad traffic — price, euro/international context, CTA.
 * Detected via fbclid / utm / referrer / ?from=fb (session-sticky). No separate route.
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

  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      delete root.dataset.fbBanner;
      document.body.style.overflow = "";
      return;
    }

    root.dataset.fbBanner = "1";
    document.body.style.overflow = "hidden";
    return () => {
      delete root.dataset.fbBanner;
      document.body.style.overflow = "";
    };
  }, [visible]);

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
          className="fb-welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
          onClick={dismiss}
        >
          <motion.div
            className="fb-welcome-banner"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ direction: isRTL ? "rtl" : "ltr" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fb-welcome-banner-card">
              <div className="fb-welcome-banner-top">
                <p className="fb-welcome-banner-title">{copy.title}</p>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label={copy.dismiss}
                  className="fb-welcome-banner-close"
                >
                  ×
                </button>
              </div>

              <p className="fb-welcome-banner-body">{copy.body}</p>
              <p className="fb-welcome-banner-price">{copy.priceNote}</p>
              <p className="fb-welcome-banner-euro">{copy.euroNote}</p>

              <button
                type="button"
                onClick={handleCta}
                disabled={loading}
                className="fb-welcome-banner-cta"
              >
                {loading ? t.campaignHero.ctaLoading : copy.cta}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
