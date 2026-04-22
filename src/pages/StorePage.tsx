import { useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ScrollStory } from "../components/home/ScrollStory";
import { Marquee } from "../components/ui/Marquee";
import { BottomCta } from "../components/home/BottomCta";
import { usePurchase } from "../hooks/usePurchase";

export function StorePage() {
  const [searchParams] = useSearchParams();
  const { status, error, initiate, reset } = usePurchase();

  const loading = status === "loading";
  const wasCancelled = searchParams.get("payment") === "cancelled";

  return (
    <Layout>
      {wasCancelled && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg text-sm"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            backdropFilter: "blur(12px)",
          }}
        >
          Payment was cancelled — you can try again whenever you're ready.
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
