import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { redeemActivationToken } from "../services/api";
import { buildQrUrl, ensureClaimUrlDevParam, formatIsraeliLocal } from "../utils/format";
import { useLanguage } from "../contexts/LanguageContext";
import { CryptoFlowSteps } from "./CryptoWaitPage";

type State =
  | { phase: "loading" }
  | { phase: "ready"; claimUrl: string; label: string }
  | { phase: "error"; message: string };

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function ActivatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const calledRef = useRef(false);
  const [state, setState] = useState<State>({ phase: "loading" });

  const token = searchParams.get("token");
  const fromCrypto = searchParams.get("pay") === "crypto";
  const purchaseLang = lang === "he" ? "he" : "en";
  const apiBase = import.meta.env.VITE_BASE_URL || "";
  const isProd = apiBase.includes("arnacon-production-gcp");

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    if (calledRef.current) return;
    calledRef.current = true;

    redeemActivationToken(token)
      .then(({ claimUrl, label }) =>
        setState({
          phase: "ready",
          claimUrl: ensureClaimUrlDevParam(claimUrl, isProd, purchaseLang),
          label,
        }),
      )
      .catch((err: Error) =>
        setState({
          phase: "error",
          message: err.message || t.claim.invalidLinkTitle,
        }),
      );
  }, [token, navigate, isProd, purchaseLang, t.claim.invalidLinkTitle]);

  return (
    <Layout hideAppStoreBadges>
      <section className={fromCrypto ? "crypto-checkout" : "activate-page"}>
        <div className={fromCrypto ? "crypto-checkout-frame" : "activate-page-frame"}>
          <AnimatePresence mode="wait">
            {state.phase === "loading" && (
              <LoadingState key="loading" fromCrypto={fromCrypto} t={t} />
            )}
            {state.phase === "ready" && (
              <QRState
                key="qr"
                claimUrl={state.claimUrl}
                label={state.label}
                fromCrypto={fromCrypto}
                onBack={() => navigate("/", { replace: true })}
                t={t}
              />
            )}
            {state.phase === "error" && (
              <ErrorState
                key="error"
                message={state.message}
                onBack={() => navigate("/", { replace: true })}
                t={t}
              />
            )}
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
}

function LoadingState({
  fromCrypto,
  t,
}: {
  fromCrypto: boolean;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  if (!fromCrypto) {
    return (
      <motion.div {...fade}>
        <p className="activate-kicker">{t.claim.activationLabel}</p>
        <h1>{t.success.loading}</h1>
        <p className="activate-lead">{t.success.loadingDesc}</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...fade} className="crypto-wait-hero">
      <div className="crypto-wait-mark" aria-hidden="true">
        <span className="crypto-wait-ring" />
        <span className="crypto-wait-orbit" />
        <span className="crypto-wait-core" />
      </div>
      <div>
        <h1>{t.success.loading}</h1>
        <p className="crypto-checkout-lead">{t.success.loadingDesc}</p>
      </div>
    </motion.div>
  );
}

function QRState({
  claimUrl,
  label,
  fromCrypto,
  onBack,
  t,
}: {
  claimUrl: string;
  label: string;
  fromCrypto: boolean;
  onBack: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const qrUrl = buildQrUrl(claimUrl, 220);

  if (!fromCrypto) {
    return (
      <motion.div {...fade}>
        <p className="activate-back">
          <button type="button" onClick={onBack}>
            {t.success.back}
          </button>
        </p>
        <p className="activate-kicker">{t.claim.activationLabel}</p>
        <h1>
          {t.claim.activateHeadlineA}
          <br />
          {t.claim.activateHeadlineB}
        </h1>
        <p className="activate-lead">{t.success.scanDesc("Arnacon")}</p>

        {label ? (
          <div className="activate-number">
            <span>{t.claim.yourNumber}</span>
            <strong dir="ltr">{formatIsraeliLocal(label)}</strong>
          </div>
        ) : null}

        <motion.div
          className="activate-qr"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src={qrUrl} alt={t.success.scanTitle} width={220} height={220} />
        </motion.div>

        <ol className="activate-how">
          {t.success.scanHow.map(([title, body]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{body}</span>
            </li>
          ))}
        </ol>

        <p className="activate-or">{t.success.orDivider}</p>
        <Button onClick={() => { window.location.href = claimUrl; }}>
          {t.success.installOnDevice}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div {...fade}>
      <p className="crypto-checkout-back">
        <button type="button" onClick={onBack}>
          {t.success.back}
        </button>
      </p>
      <p className="crypto-activate-badge">{t.success.readyBadge}</p>
      <h1>
        {t.success.scanTitle} {t.success.scanTitleB}
      </h1>
      <p className="crypto-checkout-lead">{t.success.scanDesc("Arnacon")}</p>

      {label ? (
        <div className="crypto-activate-number">
          <span>{t.claim.yourNumber}</span>
          <strong dir="ltr">{formatIsraeliLocal(label)}</strong>
        </div>
      ) : null}

      <motion.div
        className="crypto-activate-qr"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src={qrUrl} alt={t.success.scanTitle} width={220} height={220} />
      </motion.div>

      <CryptoFlowSteps copy={t.crypto} current={4} />

      <p className="crypto-activate-or">{t.success.orDivider}</p>
      <Button onClick={() => { window.location.href = claimUrl; }}>
        {t.success.installOnDevice}
      </Button>
    </motion.div>
  );
}

function ErrorState({
  message,
  onBack,
  t,
}: {
  message: string;
  onBack: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  return (
    <motion.div {...fade}>
      <p className="activate-back">
        <button type="button" onClick={onBack}>
          {t.success.back}
        </button>
      </p>
      <h1>{t.success.errorTitle}</h1>
      <p className="activate-lead">{message}</p>
      <Button variant="secondary" onClick={onBack}>
        {t.success.errorBack}
      </Button>
    </motion.div>
  );
}
