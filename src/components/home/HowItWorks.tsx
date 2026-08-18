import { useState } from "react";
import { RevealOnScroll } from "../ui/RevealOnScroll";
import { Button } from "../Button";
import { useLanguage } from "../../contexts/LanguageContext";
import { shouldShowFacebookChrome } from "../../lib/campaign";
import { trackEvent } from "../../lib/analytics";
import {
  SUPPORT_EMAIL,
  SUPPORT_TEL,
  SUPPORT_TEL_DISPLAY,
  SUPPORT_TEL_DISPLAY_IL,
} from "../../config/constants";

interface HowItWorksProps {
  onPurchase: () => void;
  loading: boolean;
  showCoupons?: boolean;
}

export function HowItWorks({
  onPurchase,
  loading,
  showCoupons = true,
}: HowItWorksProps) {
  const { t, isRTL } = useLanguage();
  const landing = t.landing;
  const steps = shouldShowFacebookChrome() ? t.campaignSteps : t.steps;
  const [copied, setCopied] = useState<string | null>(null);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      void trackEvent("coupon_copy", { code });
      window.setTimeout(() => setCopied((current) => (current === code ? null : current)), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="landing-page">
      <section className="landing-section" aria-labelledby="landing-why-title">
        <RevealOnScroll>
          <p className="landing-kicker">{landing.usesKicker}</p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.06}>
          <h2 id="landing-why-title" className="landing-h2">
            {landing.usesTitle}
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.1}>
          <p className="landing-why-body">{landing.whyBody}</p>
        </RevealOnScroll>
        <div className="landing-why-grid">
          {landing.uses.map((use, i) => (
            <RevealOnScroll key={use.title} delay={0.04 * i}>
              <article className="landing-why-card">
                <h3>{use.title}</h3>
                <p>{use.body}</p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-plan-title">
        <RevealOnScroll>
          <p className="landing-kicker">{landing.planKicker}</p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.06}>
          <h2 id="landing-plan-title" className="landing-h2">
            {landing.planTitle}
          </h2>
        </RevealOnScroll>

        <div className="landing-plan">
          <div className="landing-plan-price">
            <p className="landing-plan-monthly">{landing.planPrice}</p>
            <p className="landing-plan-setup">{landing.planSetup}</p>
          </div>

          <ul className="landing-plan-items">
            {landing.planItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <Button
            onClick={onPurchase}
            loading={loading}
            disabled={loading}
            className="landing-buy"
          >
            {loading ? t.hero.ctaLoading : landing.planCta}
          </Button>
        </div>
      </section>

      {showCoupons && (
        <section className="landing-section" aria-labelledby="landing-coupon-title">
          <RevealOnScroll>
            <p className="landing-kicker">{landing.couponKicker}</p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.06}>
            <h2 id="landing-coupon-title" className="landing-h2">
              {landing.couponTitle}
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <p className="landing-why-body">{landing.couponBody}</p>
          </RevealOnScroll>

          <div className="landing-coupons">
            {landing.coupons.map((coupon) => (
              <article key={coupon.code} className="landing-coupon">
                <button
                  type="button"
                  className="landing-coupon-code"
                  dir="ltr"
                  onClick={() => void copyCode(coupon.code)}
                >
                  <code>{coupon.code}</code>
                  <em>{copied === coupon.code ? landing.couponCopied : landing.couponCopy}</em>
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="landing-section" aria-labelledby="landing-how-title">
        <RevealOnScroll>
          <p className="landing-kicker">{landing.howKicker}</p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.06}>
          <h2 id="landing-how-title" className="landing-h2">
            {landing.howTitle}
          </h2>
        </RevealOnScroll>
        <ol className="landing-how">
          {steps.map((step) => (
            <li key={step.step} className="landing-how-step">
              <span>{step.step}</span>
              <h3>
                {step.headlineA} {step.headlineB}
              </h3>
              <p>{step.sub}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section landing-support" aria-labelledby="landing-support-title">
        <p className="landing-kicker">{landing.supportKicker}</p>
        <h2 id="landing-support-title" className="landing-h2">
          {landing.couponSupport}
        </h2>
        <div className="landing-support-actions">
          <a className="landing-support-btn" href={`tel:${SUPPORT_TEL}`}>
            <span>{landing.couponCall}</span>
            <span className="ltr-num" dir="ltr">
              {isRTL ? SUPPORT_TEL_DISPLAY_IL : SUPPORT_TEL_DISPLAY}
            </span>
          </a>
          <a className="landing-support-btn landing-support-btn--ghost" href={`mailto:${SUPPORT_EMAIL}`}>
            <span>{landing.couponEmail}</span>
            <span className="ltr-num" dir="ltr">{SUPPORT_EMAIL}</span>
          </a>
        </div>
        <p className="landing-support-hours">{landing.supportHours}</p>
      </section>

      <section className="landing-section landing-section--last" aria-labelledby="landing-faq-title">
        <RevealOnScroll>
          <p className="landing-kicker">{landing.faqKicker}</p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.06}>
          <h2 id="landing-faq-title" className="landing-h2">
            {landing.faqTitle}
          </h2>
        </RevealOnScroll>
        <p className="landing-why-body">{landing.faqSub}</p>
        <div className="landing-faq">
          {landing.faq.map((item) => (
            <details key={item.q} className="landing-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
