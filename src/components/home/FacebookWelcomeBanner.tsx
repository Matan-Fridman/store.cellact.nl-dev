import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  clearFbBannerDismiss,
  dismissFbBanner,
  FB_COUPON_CODE,
  getFbOfferVariant,
  isFbBannerDismissed,
  shouldShowFacebookChrome,
  type FbOfferVariant,
} from "../../lib/campaign";
import { trackEvent } from "../../lib/analytics";

interface FacebookWelcomeBannerProps {
  onPurchase: () => void;
  loading: boolean;
}

/**
 * Centered Facebook offer modal.
 * A/B: nocoupon (secondary number, full price) vs coupon30 (SecNumAgain30).
 */
export function FacebookWelcomeBanner({
  onPurchase,
  loading,
}: FacebookWelcomeBannerProps) {
  const { t, isRTL } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resolve offer first so ?fbOffer= clears a prior dismiss before we gate on it.
  const show = shouldShowFacebookChrome();
  const variant: FbOfferVariant = show ? getFbOfferVariant() : "nocoupon";
  const isCoupon = variant === "coupon30";

  useEffect(() => {
    if (!show || variant === "coupon67") return;

    // Hard reopen for QA / forced arms (covers HMR + earlier X-close in same tab).
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("fbOffer") === "nocoupon" ||
        params.get("fbOffer") === "coupon30" ||
        params.get("fbBanner") === "1"
      ) {
        clearFbBannerDismiss();
      }
    } catch {
      // ignore
    }

    if (isFbBannerDismissed()) return;
    setVisible(true);
    void trackEvent("fb_welcome_impression", { fbOffer: variant });
  }, [show, variant]);

  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      delete root.dataset.fbBanner;
      delete root.dataset.fbOffer;
      document.body.style.overflow = "";
      return;
    }

    root.dataset.fbBanner = "1";
    root.dataset.fbOffer = variant;
    document.body.style.overflow = "hidden";
    return () => {
      delete root.dataset.fbBanner;
      delete root.dataset.fbOffer;
      document.body.style.overflow = "";
    };
  }, [visible, variant]);

  if (!show || !visible || variant === "coupon67") return null;

  const copy = isCoupon ? t.campaign.welcomeBannerCoupon : t.campaign.welcomeBanner;

  const dismiss = () => {
    setVisible(false);
    dismissFbBanner();
  };

  const handleCta = () => {
    void trackEvent("fb_welcome_click", { fbOffer: variant });
    onPurchase();
  };

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(copy.couponCode || FB_COUPON_CODE);
      setCopied(true);
      void trackEvent("fb_coupon_copy", { code: copy.couponCode || FB_COUPON_CODE });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
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
            className={`fb-welcome-banner${isCoupon ? " fb-welcome-banner--coupon" : ""}`}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ direction: isRTL ? "rtl" : "ltr" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fb-welcome-banner-card">
              <button
                type="button"
                onClick={dismiss}
                aria-label={copy.dismiss}
                className="fb-welcome-banner-close"
              >
                ×
              </button>

              <p className="fb-welcome-banner-brand">{copy.brand}</p>
              <h2 className="fb-welcome-banner-title">{copy.title}</h2>
              <p className="fb-welcome-banner-body">{copy.body}</p>

              {isCoupon && (
                <div className="fb-welcome-banner-offer">
                  <span className="fb-welcome-banner-badge">{copy.couponBadge}</span>
                  <button
                    type="button"
                    className="fb-welcome-banner-code"
                    onClick={copyCoupon}
                    dir="ltr"
                  >
                    <span>{copy.couponCode || FB_COUPON_CODE}</span>
                    <em>{copied ? (isRTL ? "הועתק" : "Copied") : isRTL ? "העתק" : "Copy"}</em>
                  </button>
                </div>
              )}

              <p className="fb-welcome-banner-price">{copy.priceNote}</p>

              <button
                type="button"
                onClick={handleCta}
                disabled={loading}
                className="fb-welcome-banner-cta"
              >
                {loading ? t.campaignHero.ctaLoading : copy.cta}
              </button>

              <button
                type="button"
                className="fb-welcome-banner-more"
                onClick={dismiss}
              >
                {copy.learnMore}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
