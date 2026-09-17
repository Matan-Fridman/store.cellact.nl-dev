import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { claimLightPbx, redeemActivationToken } from "../services/api";
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

function canonicalWeb3Identity(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (value.endsWith(".arnacon.global")) return value;
  if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) {
    return `${value}.arnacon.global`;
  }
  return null;
}

export function LightPbxActivatePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const web3identity = canonicalWeb3Identity(searchParams.get("web3identity") || "");
  const [state, setState] = useState<"ready" | "claiming" | "done" | "error">(
    token ? "ready" : "error",
  );
  const [error, setError] = useState(token ? "" : "This invite link is missing its token.");
  const [extension, setExtension] = useState("");

  const returnUrl = useMemo(() => {
    if (!token) return "";
    const url = new URL(`${window.location.origin}/lightpbx/activate`);
    url.searchParams.set("token", token);
    url.searchParams.set("flow", "secnum-claim-v1");
    return url.toString();
  }, [token]);

  const arnaconUrl = returnUrl
    ? `arnacon://install?url=${encodeURIComponent(returnUrl)}&provider=Cellact-LightPBX`
    : "";
  const qrUrl = arnaconUrl ? buildQrUrl(arnaconUrl, 200) : "";

  const claim = useCallback(async () => {
    if (!token || !web3identity) return;
    setState("claiming");
    setError("");
    try {
      const result = await claimLightPbx(token, web3identity);
      setExtension(result.extension);
      setState("done");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not join Light PBX.");
      setState("error");
    }
  }, [token, web3identity]);

  useEffect(() => {
    if (token && web3identity) void claim();
  }, [token, web3identity, claim]);

  const title = state === "done" ? "You're in." : "Join your Light PBX team";
  const lead =
    state === "done"
      ? `You're on the team. Your extension is ${extension || "ready"}.`
      : web3identity
        ? "Finishing your join to the Light PBX team…"
        : "Open this invite in Arnacon on your phone, then tap to join your team.";

  return (
    <Layout hideAppStoreBadges>
      <section className="activate-page">
        <div className="activate-page-frame">
          <p className="activate-kicker">Light PBX</p>
          <h1>{title}</h1>
          <p className="activate-lead">{lead}</p>

          {!web3identity && state !== "done" && token && (
            <>
              {arnaconUrl && (
                <Button
                  className="w-full"
                  type="button"
                  onClick={() => {
                    window.location.href = arnaconUrl;
                  }}
                >
                  Open in Arnacon
                </Button>
              )}
              <p className="activate-lead">On your phone, tap Open in Arnacon to join your team.</p>
              {qrUrl && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="activate-lead">On a computer? Scan this QR with your phone.</p>
                  <div className="rounded-2xl bg-white p-3">
                    <img src={qrUrl} alt="Scan to open this invite in Arnacon" width={180} height={180} />
                  </div>
                </div>
              )}
            </>
          )}

          {web3identity && state === "ready" && (
            <Button onClick={() => void claim()}>Join Light PBX team</Button>
          )}
          {state === "claiming" && <p className="activate-lead">Joining your team…</p>}
          {error && <p className="activate-lead">{error}</p>}
        </div>
      </section>
    </Layout>
  );
}
