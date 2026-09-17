import { useLanguage } from "../../contexts/LanguageContext";
import { shouldShowConversionLanding } from "../../lib/campaign";

/**
 * Continuously scrolling horizontal ticker.
 * Items are repeated 3× so the animation loop is seamless.
 */
export function Marquee() {
  const { t } = useLanguage();
  const items = shouldShowConversionLanding() ? t.campaignMarquee : t.marquee;
  const allItems = [...items, ...items, ...items];

  return (
    <div
      style={{
        overflow: "hidden",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
        padding: "18px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "max-content",
          animation: "marquee 32s linear infinite",
        }}
      >
        {allItems.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              fontSize: "10.5px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              padding: "0 20px",
              gap: "20px",
            }}
          >
            {item}
            <span style={{ opacity: 0.25, fontSize: "8px" }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
