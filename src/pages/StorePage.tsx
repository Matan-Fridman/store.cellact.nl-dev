import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { HeroSection } from "../components/home/HeroSection";
import { HowItWorks } from "../components/home/HowItWorks";
import { FacebookWelcomeBanner } from "../components/home/FacebookWelcomeBanner";
import { Button } from "../components/Button";
import { usePurchase } from "../hooks/usePurchase";
import { useLanguage } from "../contexts/LanguageContext";
import {
  trackCheckoutCancel,
  trackEvent,
  trackExperimentExposure,
  trackViewContent,
} from "../lib/analytics";
import {
  hasFacebookLandingParams,
  getFbOfferVariant,
  shouldShowFacebookChrome,
} from "../lib/campaign";
import { isCryptoEnabled } from "../config/constants";

export function StorePage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { status, error, initiate, reset } = usePurchase();
  const { t } = useLanguage();
  const [showSticky, setShowSticky] = useState(false);

  const loading = status === "loading";
  const wasCancelled = searchParams.get("payment") === "cancelled";
  const facebookChrome = shouldShowFacebookChrome();
  const sixSevenArm = facebookChrome && getFbOfferVariant() === "coupon67";
  const hero = facebookChrome ? t.campaignHero : t.hero;

  useEffect(() => {
    document.documentElement.setAttribute("data-landing", "1");
    if (facebookChrome) document.documentElement.dataset.fbLand = "1";
    return () => {
      document.documentElement.removeAttribute("data-landing");
      delete document.documentElement.dataset.fbLand;
    };
  }, [facebookChrome]);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (sixSevenArm) return;
    trackExperimentExposure();
    trackViewContent();
    if (hasFacebookLandingParams()) {
      void trackEvent("fb_landing");
    }
  }, [sixSevenArm]);

  useEffect(() => {
    if (wasCancelled) trackCheckoutCancel();
  }, [wasCancelled]);

  if (sixSevenArm) {
    return <Navigate to={{ pathname: "/67", search: location.search }} replace />;
  }

  return (
    <Layout
      hideAppStoreBadges
      onBuy={initiate}
      buyLabel={hero.cta}
      buyLoading={loading}
    >
      <FacebookWelcomeBanner onPurchase={initiate} loading={loading} />

      {wasCancelled && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg text-sm"
          style={{
            top: "calc(72px + env(safe-area-inset-top, 0px))",
            background: "#fff",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            backdropFilter: "blur(12px)",
            maxWidth: "min(480px, calc(100% - 24px))",
            textAlign: "center",
          }}
        >
          {t.campaign.cancelled}
        </div>
      )}

      <HeroSection
        onPurchase={initiate}
        loading={loading}
        error={error}
        onDismissError={reset}
      />

      <HowItWorks
        onPurchase={initiate}
        loading={loading}
        showCoupons={!facebookChrome}
      />

      {isCryptoEnabled() ? (
        <>
          <section className="crypto-pay">
            <h2>{t.crypto.landingTitle}</h2>
            <p>{t.crypto.landingLead}</p>
            <Link to="/crypto" className="btn-primary crypto-pay-link">
              {t.crypto.landingCta}
            </Link>
          </section>

          <section className="crypto-explain-landing">
            <h2>{t.crypto.landingExplainTitle}</h2>
            <p>{t.crypto.landingExplainLead}</p>
            <Link to="/crypto/why">{t.crypto.landingExplainCta}</Link>
          </section>
        </>
      ) : null}

      {showSticky && (
        <div className="landing-sticky">
          <p>{t.landing.stickyTag}</p>
          <Button
            onClick={initiate}
            loading={loading}
            disabled={loading}
            className="landing-buy landing-sticky-buy"
          >
            {loading ? hero.ctaLoading : hero.cta}
          </Button>
        </div>
      )}
    </Layout>
  );
}
