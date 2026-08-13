import { useEffect } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ScrollStory } from "../components/home/ScrollStory";
import { Marquee } from "../components/ui/Marquee";
import { BottomCta } from "../components/home/BottomCta";
import { FacebookWelcomeBanner } from "../components/home/FacebookWelcomeBanner";
import { usePurchase } from "../hooks/usePurchase";
import { useLanguage } from "../contexts/LanguageContext";
import {
  trackCheckoutCancel,
  trackEvent,
  trackExperimentExposure,
  trackViewContent,
} from "../lib/analytics";
import {
  getFbOfferVariant,
  isFacebookTraffic,
  shouldShowConversionLanding,
  shouldShowFacebookChrome,
} from "../lib/campaign";

export function StorePage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { status, error, initiate, reset } = usePurchase();
  const { t } = useLanguage();

  const loading = status === "loading";
  const wasCancelled = searchParams.get("payment") === "cancelled";
  const conversionLanding = shouldShowConversionLanding();
  const facebookChrome = shouldShowFacebookChrome();
  const sixSevenArm = facebookChrome && getFbOfferVariant() === "coupon67";

  useEffect(() => {
    if (sixSevenArm) return;
    trackExperimentExposure();
    trackViewContent();
    if (isFacebookTraffic()) {
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
    <Layout hideAppStoreBadges={conversionLanding || facebookChrome}>
      <FacebookWelcomeBanner onPurchase={initiate} loading={loading} />

      {wasCancelled && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg text-sm"
          style={{
            top: "calc(72px + env(safe-area-inset-top, 0px))",
            background: "rgba(255,255,255,0.05)",
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

      <ScrollStory
        onPurchase={initiate}
        loading={loading}
        error={error}
        onDismissError={reset}
        compact={facebookChrome}
      />

      {/* FB: don't make them scroll a theater after an ad click */}
      {!facebookChrome && (
        <>
          <Marquee />
          <BottomCta onPurchase={initiate} loading={loading} />
        </>
      )}
    </Layout>
  );
}
