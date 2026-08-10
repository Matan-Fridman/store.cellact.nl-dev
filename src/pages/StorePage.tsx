import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ScrollStory } from "../components/home/ScrollStory";
import { Marquee } from "../components/ui/Marquee";
import { BottomCta } from "../components/home/BottomCta";
import { CampaignBanner } from "../components/home/CampaignBanner";
import { usePurchase } from "../hooks/usePurchase";
import { useLanguage } from "../contexts/LanguageContext";
import {
  trackCheckoutCancel,
  trackEvent,
  trackViewContent,
} from "../lib/analytics";
import { getAbVariant, isFacebookTraffic } from "../lib/campaign";

export function StorePage() {
  const [searchParams] = useSearchParams();
  const { status, error, initiate, reset } = usePurchase();
  const { t } = useLanguage();

  const loading = status === "loading";
  const wasCancelled = searchParams.get("payment") === "cancelled";
  const fromFb = isFacebookTraffic();

  useEffect(() => {
    trackViewContent();
    if (fromFb) {
      void trackEvent("fb_landing", { abVariant: getAbVariant() });
    }
  }, [fromFb]);

  useEffect(() => {
    if (wasCancelled) trackCheckoutCancel();
  }, [wasCancelled]);

  return (
    <Layout hideAppStoreBadges={fromFb}>
      <CampaignBanner onPurchase={initiate} loading={loading} />

      {wasCancelled && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg text-sm"
          style={{
            top: fromFb ? "148px" : "80px",
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
      />

      <Marquee />

      <BottomCta onPurchase={initiate} loading={loading} />
    </Layout>
  );
}
