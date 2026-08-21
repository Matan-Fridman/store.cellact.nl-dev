import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ethers } from "ethers";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { useLanguage } from "../contexts/LanguageContext";
import { claimCryptoActivation, getCryptoStatus } from "../services/api";
import { pickEthereum, cryptoErrorCopy, escrowTxUrl, isCryptoChainId, logCryptoError, signerFromInjected, type CryptoChainId } from "../hooks/useCryptoPurchase";

const CLAIM_TYPES = {
  ClaimActivation: [
    { name: "payer", type: "address" },
    { name: "orderId", type: "bytes32" },
    { name: "issuedAt", type: "uint256" },
  ],
};

type WaitSession = {
  orderId?: string;
  chainId?: number;
  escrow?: string;
  txHash?: string;
};

type Phase = "work" | "done" | "ready";

type FlowCopy = {
  waitStepPay: string;
  waitStepPrep: string;
  waitStepSign: string;
  waitStepScan: string;
  waitTitle: string;
};

export type FlowStepState = "done" | "current" | "soon";

export function cryptoActivationSteps(copy: FlowCopy, current: 1 | 2 | 3 | 4) {
  const labels = [copy.waitStepPay, copy.waitStepPrep, copy.waitStepSign, copy.waitStepScan];
  return labels.map((label, index) => {
    const n = index + 1;
    const state: FlowStepState = n < current ? "done" : n === current ? "current" : "soon";
    return { label, state };
  });
}

export function CryptoFlowSteps({
  copy,
  current,
}: {
  copy: FlowCopy;
  current: 1 | 2 | 3 | 4;
}) {
  return (
    <ol className="crypto-wait-steps" aria-label={copy.waitTitle}>
      {cryptoActivationSteps(copy, current).map((step, index) => (
        <li key={step.label} className={`is-${step.state}`}>
          <span className="crypto-wait-num">{step.state === "done" ? "✓" : index + 1}</span>
          {step.label}
        </li>
      ))}
    </ol>
  );
}

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

export function CryptoWaitPage() {
  const { t, lang: uiLang } = useLanguage();
  const copy = t.crypto;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const stored = sessionStorage.getItem("secnum_crypto_wait");
  const parsed = stored ? (JSON.parse(stored) as WaitSession) : null;
  const orderId = params.get("order") || parsed?.orderId || "";
  const chainId = Number(params.get("chain") || parsed?.chainId || 0) as CryptoChainId;
  const lang = params.get("lang") === "he" || uiLang === "he" ? "he" : "en";
  const txHash = parsed?.txHash || "";
  const [phase, setPhase] = useState<Phase>("work");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [escrow, setEscrow] = useState(parsed?.escrow || "");

  useEffect(() => {
    if (!orderId || !isCryptoChainId(chainId)) {
      navigate("/crypto/recover", { replace: true });
      return;
    }
    let cancelled = false;
    let timer = 0;
    const tick = async () => {
      try {
        const status = await getCryptoStatus({ orderId, chainId, lang });
        if (cancelled) return;
        if (status.escrow) setEscrow(status.escrow);
        if (status.provisioned) {
          setPaid(true);
          setPhase((current) => (current === "ready" ? "ready" : "done"));
          window.clearInterval(timer);
          return;
        }
        if (status.paid) setPaid(true);
      } catch (err) {
        if (cancelled) return;
        const status =
          err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number"
            ? (err as { status: number }).status
            : 0;
        if (status >= 500 || status === 0) {
          setError(null);
          setPaid(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Status failed");
      }
    };
    void tick();
    timer = window.setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [navigate, orderId, chainId, lang]);

  useEffect(() => {
    if (phase !== "done") return;
    const timer = window.setTimeout(() => setPhase("ready"), 1200);
    return () => window.clearTimeout(timer);
  }, [phase]);

  async function signAndActivate() {
    setSigning(true);
    setError(null);
    try {
      if (!orderId || !escrow) throw new Error("Reconnect your wallet.");
      const injected = await pickEthereum();
      const { signer, address: payer } = await signerFromInjected(injected);
      const issuedAt = Math.floor(Date.now() / 1000);
      const orderIdBytes32 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(orderId));
      const signature = await signer._signTypedData(
        {
          name: "SecnumCryptoClaim",
          version: "1",
          chainId,
          verifyingContract: escrow,
        },
        CLAIM_TYPES,
        { payer, orderId: orderIdBytes32, issuedAt },
      );
      const { token } = await claimCryptoActivation({
        orderId,
        signature,
        issuedAt,
      });
      navigate(`/activate?token=${encodeURIComponent(token)}&pay=crypto`, { replace: true });
    } catch (err) {
      logCryptoError("wait-claim", err);
      setError(cryptoErrorCopy(copy, err));
    } finally {
      setSigning(false);
    }
  }

  const current: 1 | 2 | 3 = phase === "ready" || phase === "done" ? 3 : paid ? 2 : 1;
  const working = phase === "work";
  const title = phase === "ready"
    ? copy.waitReadyTitle
    : phase === "done"
      ? copy.waitDoneTitle
      : paid
        ? copy.waitPrepTitle
        : copy.waitWorkingTitle;
  const lead = phase === "ready"
    ? copy.waitReady
    : phase === "done"
      ? copy.waitDoneLead
      : paid
        ? copy.waitPaid
        : copy.waitPending;

  return (
    <Layout hideAppStoreBadges>
      <section className="crypto-checkout">
        <div className="crypto-checkout-frame">
          <p className="crypto-checkout-back">
            <Link to="/crypto">{copy.back}</Link>
          </p>
          <p className="crypto-checkout-kicker">{copy.kicker}</p>

          <AnimatePresence mode="wait">
            <motion.div key={title} {...fade}>
              <div className="crypto-wait-hero">
                <div
                  className={`crypto-wait-mark${working ? "" : " is-done"}`}
                  aria-hidden="true"
                >
                  {working ? (
                    <>
                      <span className="crypto-wait-ring" />
                      <span className="crypto-wait-orbit" />
                      <span className="crypto-wait-core" />
                    </>
                  ) : (
                    <>
                      <span className="crypto-wait-ring" />
                      <span className="crypto-wait-core" />
                      <span className="crypto-wait-check">✓</span>
                    </>
                  )}
                </div>
                <div>
                  <h1>{title}</h1>
                  <p className="crypto-checkout-lead">{lead}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <CryptoFlowSteps copy={copy} current={current} />

          {error && (
            <p className="crypto-checkout-error" role="alert">
              {error}
            </p>
          )}

          {phase === "ready" && (
            <Button onClick={() => void signAndActivate()} loading={signing} disabled={signing}>
              {signing ? copy.waitSigning : copy.waitSign}
            </Button>
          )}

          {working && <p className="crypto-wait-meta">{copy.waitKeepOpen}</p>}
          <p className="crypto-wait-meta">{copy.waitOrder(orderId)}</p>
          {txHash && isCryptoChainId(chainId) && (
            <p className="crypto-wait-meta">
              <a href={escrowTxUrl(chainId, txHash)} target="_blank" rel="noreferrer">
                {copy.waitViewTx}
              </a>
            </p>
          )}
          <p className="crypto-checkout-recover">
            {copy.waitLeft} <Link to="/crypto/recover">{copy.recoverLink}</Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
