import { motion } from "framer-motion";
import { Button } from "../Button";
import { ErrorAlert } from "../ErrorAlert";
import { useLanguage } from "../../contexts/LanguageContext";
import { shouldShowFacebookChrome } from "../../lib/campaign";

interface HeroCopyProps {
  onPurchase: () => void;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
}

const item = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const, delay },
});

export function HeroCopy({ onPurchase, loading, error, onDismissError }: HeroCopyProps) {
  const { t } = useLanguage();
  const copy = shouldShowFacebookChrome() ? t.campaignHero : t.hero;
  const landing = t.landing;

  return (
    <div className="landing-hero-copy">
      <motion.p {...item(0.08)} className="landing-kicker">
        {copy.eyebrow}
      </motion.p>

      <motion.h1 {...item(0.18)} className="landing-hero-title">
        {copy.headlineA}
        <br />
        <span className="gradient-text">{copy.headlineB}</span>
      </motion.h1>

      <motion.p {...item(0.3)} className="landing-hero-sub">
        {copy.sub}
      </motion.p>

      <motion.div {...item(0.36)} className="landing-allowance-wrap">
        <p className="landing-allowance-kicker">{landing.allowanceKicker}</p>
        <div className="landing-allowance" aria-label={landing.stickyTag}>
          <div className="landing-allowance-item">
            <strong className="ltr-num" dir="ltr">{landing.minutesValue}</strong>
            <span>{landing.minutesLabel}</span>
          </div>
          <span className="landing-allowance-and" aria-hidden="true">
            +
          </span>
          <div className="landing-allowance-item">
            <strong className="ltr-num" dir="ltr">{landing.smsValue}</strong>
            <span>{landing.smsLabel}</span>
          </div>
        </div>
      </motion.div>

      <motion.div {...item(0.42)} className="landing-hero-cta">
        <Button
          onClick={onPurchase}
          loading={loading}
          disabled={loading}
          fullWidth={false}
          className="landing-buy landing-hero-buy"
        >
          {loading ? copy.ctaLoading : copy.cta}
        </Button>

        <p className="landing-fineprint">{copy.finePrint}</p>

        <ErrorAlert message={error} onDismiss={onDismissError} />
      </motion.div>
    </div>
  );
}
