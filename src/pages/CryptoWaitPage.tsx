import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { useLanguage } from "../contexts/LanguageContext";
import { claimCryptoActivation, getCryptoStatus } from "../services/api";
import { pickEthereum, cryptoErrorCopy, logCryptoError, type CryptoChainId } from "../hooks/useCryptoPurchase";

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
  const [message, setMessage] = useState(copy.waitPending);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [escrow, setEscrow] = useState(parsed?.escrow || "");

  useEffect(() => {
    if (!orderId || (chainId !== 80002 && chainId !== 11155111)) {
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
          setReady(true);
          setMessage(copy.waitReady);
          window.clearInterval(timer);
          return;
        }
        setMessage(status.paid ? copy.waitPaid : copy.waitPending);
      } catch (err) {
        if (cancelled) return;
        const status =
          err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number"
            ? (err as { status: number }).status
            : 0;
        if (status >= 500 || status === 0) {
          setError(null);
          setMessage(copy.waitPaid);
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
  }, [navigate, orderId, chainId, lang, copy.waitPaid, copy.waitPending, copy.waitReady]);

  async function signAndActivate() {
    setSigning(true);
    setError(null);
    try {
      if (!orderId || !escrow) throw new Error("Reconnect your wallet.");
      const injected = await pickEthereum();
      const web3 = new ethers.providers.Web3Provider(injected as ethers.providers.ExternalProvider);
      await web3.send("eth_requestAccounts", []);
      const signer = web3.getSigner();
      const payer = await signer.getAddress();
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
      navigate(`/activate?token=${encodeURIComponent(token)}`, { replace: true });
    } catch (err) {
      logCryptoError("wait-claim", err);
      setError(cryptoErrorCopy(copy, err));
    } finally {
      setSigning(false);
    }
  }

  return (
    <Layout hideAppStoreBadges>
      <section className="crypto-checkout">
        <div className="crypto-checkout-frame">
          <p className="crypto-checkout-back">
            <Link to="/crypto">{copy.back}</Link>
          </p>
          <p className="crypto-checkout-kicker">{copy.kicker}</p>
          <h1>{copy.waitTitle}</h1>
          <p className="crypto-checkout-lead">{message}</p>
          {error && (
            <p className="crypto-checkout-error" role="alert">
              {error}
            </p>
          )}
          {ready && (
            <Button onClick={() => void signAndActivate()} loading={signing} disabled={signing}>
              {signing ? copy.waitSigning : copy.waitSign}
            </Button>
          )}
          {!ready && <p className="crypto-checkout-review-meta">{copy.waitKeepOpen(orderId)}</p>}
          <p className="crypto-checkout-recover">
            {copy.waitLeft} <Link to="/crypto/recover">{copy.recoverLink}</Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
