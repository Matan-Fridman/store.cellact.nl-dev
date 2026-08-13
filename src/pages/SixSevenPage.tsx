import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { usePurchase } from "../hooks/usePurchase";
import { useLanguage } from "../contexts/LanguageContext";
import {
  FB_COUPON_CODE_67,
  forceCoupon67Offer,
  isFacebookTraffic,
} from "../lib/campaign";
import {
  trackEvent,
  trackExperimentExposure,
  trackViewContent,
} from "../lib/analytics";

/**
 * Dedicated 67% offer page (six-seven).
 * Facebook A/B arm `coupon67` redirects here; /67 also works as a direct URL.
 */
export function SixSevenPage() {
  forceCoupon67Offer();

  const { t, isRTL } = useLanguage();
  const { status, error, initiate, reset } = usePurchase({ cancelPath: "/67" });
  const [copied, setCopied] = useState(false);
  const copy = t.campaign.sixSevenPage;
  const loading = status === "loading";
  const code = copy.couponCode || FB_COUPON_CODE_67;

  useEffect(() => {
    trackExperimentExposure();
    trackViewContent();
    if (isFacebookTraffic()) {
      void trackEvent("fb_landing");
    }
    void trackEvent("fb_welcome_impression", { fbOffer: "coupon67" });
  }, []);

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      void trackEvent("fb_coupon_copy", { code });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const handleCta = () => {
    void trackEvent("fb_welcome_click", { fbOffer: "coupon67" });
    void initiate();
  };

  return (
    <Layout hideAppStoreBadges>
      <section
        className="six-seven-page"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        <div className="six-seven-charge" aria-hidden="true">
          <span>6</span>
          <em>7</em>
        </div>

        <p className="six-seven-brand">{copy.brand}</p>
        <p className="six-seven-kicker">{copy.kicker}</p>
        <p className="six-seven-percent">{copy.percent}</p>
        <h1 className="six-seven-headline">{copy.headline}</h1>
        <p className="six-seven-body">{copy.body}</p>
        <p className="six-seven-laugh">{copy.laugh}</p>

        <div className="six-seven-offer">
          <span className="six-seven-badge">{copy.couponBadge}</span>
          <p className="six-seven-price">{copy.priceNote}</p>
          <button type="button" className="six-seven-code" onClick={copyCoupon} dir="ltr">
            <span>{code}</span>
            <em>{copied ? (isRTL ? "הועתק" : "Copied") : isRTL ? "העתק" : "Copy"}</em>
          </button>
          <p className="six-seven-hint">{copy.couponHint}</p>
        </div>

        <p className="six-seven-euro">{copy.euroNote}</p>

        {error && (
          <button type="button" className="six-seven-error" onClick={reset}>
            {error}
          </button>
        )}

        <button
          type="button"
          className="six-seven-cta"
          onClick={handleCta}
          disabled={loading}
        >
          {loading ? t.campaignHero.ctaLoading : copy.cta}
        </button>
      </section>
    </Layout>
  );
}
