import { useRef, useState } from "react";
import { HeroCopy } from "./HeroCopy";
import { PhoneFloat } from "./PhoneFloat";
import { useLanguage } from "../../contexts/LanguageContext";
import { shouldShowFacebookChrome } from "../../lib/campaign";
import { trackEvent } from "../../lib/analytics";

interface HeroSectionProps {
  onPurchase: () => void;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
}

export function HeroSection(props: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const facebook = shouldShowFacebookChrome();

  return (
    <section
      ref={containerRef}
      className="landing-hero relative flex items-center"
    >
      <div
        aria-hidden
        className="landing-hero-glow pointer-events-none absolute inset-0"
      />

      {!facebook && <LaunchFlag />}

      <div className="landing-hero-inner relative z-10 w-full px-6 mx-auto">
        <div className="hero-grid">
          <HeroCopy {...props} />
          <PhoneFloat containerRef={containerRef} />
        </div>
      </div>
    </section>
  );
}

const FLAG_REST =
  "M3,18 C42,6 58,28 98,16 C138,4 158,22 197,14 L197,96 C158,108 138,90 98,102 C58,114 42,96 3,108 Z";
const FLAG_UP =
  "M3,22 C46,2 62,30 102,10 C144,-4 162,24 197,8 L197,90 C162,110 144,88 102,108 C62,124 46,100 3,112 Z";
const FLAG_DOWN =
  "M3,14 C38,28 64,8 96,24 C136,40 160,10 197,20 L197,104 C160,92 136,118 96,102 C64,90 38,112 3,104 Z";

function LaunchFlag() {
  const { t, isRTL } = useLanguage();
  const coupon = t.landing.coupons[0];
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      void trackEvent("coupon_copy", { code: coupon.code, placement: "hero_flag" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="landing-flag" aria-hidden={false}>
      <span className="landing-flag-pole">
        <span className="landing-flag-finial" />
      </span>

      <button
        type="button"
        className="landing-flag-cloth"
        onClick={() => void copyCode()}
        aria-label={`${t.landing.flagOffer} ${coupon.code}`}
      >
        <svg
          className="landing-flag-shape"
          viewBox="0 0 200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="landing-flag-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d7f2ff" />
              <stop offset="45%" stopColor="#8fd4ff" />
              <stop offset="100%" stopColor="#5eb8ef" />
            </linearGradient>
          </defs>
          <path fill="url(#landing-flag-grad)" d={FLAG_REST}>
            <animate
              attributeName="d"
              dur="4s"
              repeatCount="indefinite"
              values={`${FLAG_REST};${FLAG_UP};${FLAG_REST};${FLAG_DOWN};${FLAG_REST}`}
            />
          </path>
        </svg>
        <span className="landing-flag-copy" dir={isRTL ? "rtl" : "ltr"}>
          <span className="landing-flag-kicker">{t.landing.flagKicker}</span>
          <span className="landing-flag-offer">{t.landing.flagOffer}</span>
          <strong className="landing-flag-code ltr-num" dir="ltr">
            {copied ? t.landing.couponCopied : coupon.code}
          </strong>
          {!copied && (
            <span className="landing-flag-hint">{t.landing.flagHint}</span>
          )}
        </span>
      </button>
    </div>
  );
}
