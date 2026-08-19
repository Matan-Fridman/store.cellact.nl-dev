import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { claimCryptoActivation, getCryptoStatus } from "../services/api";
import { pickEthereum, type CryptoChainId } from "../hooks/useCryptoPurchase";

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
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const stored = sessionStorage.getItem("secnum_crypto_wait");
  const parsed = stored ? (JSON.parse(stored) as WaitSession) : null;
  const orderId = params.get("order") || parsed?.orderId || "";
  const chainId = Number(params.get("chain") || parsed?.chainId || 0) as CryptoChainId;
  const lang = params.get("lang") === "he" ? "he" : "en";
  const [message, setMessage] = useState("Waiting for on-chain payment and provisioning.");
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
          setMessage("Payment confirmed. Sign with the paying wallet to get your QR.");
          window.clearInterval(timer);
          return;
        }
        setMessage(
          status.paid ? "Paid. Provisioning your number…" : "Waiting for the escrow subscribe transaction…",
        );
      } catch (err) {
        if (cancelled) return;
        const status =
          err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number"
            ? (err as { status: number }).status
            : 0;
        if (status >= 500 || status === 0) {
          setError(null);
          setMessage("Payment sent. Confirming on-chain and provisioning…");
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
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setSigning(false);
    }
  }

  return (
    <Layout>
      <section className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Pay with crypto</h1>
        <p className="text-sm mb-6">{message}</p>
        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
        {ready && (
          <Button onClick={() => void signAndActivate()} loading={signing} disabled={signing}>
            {signing ? "Waiting for signature…" : "Sign and show QR"}
          </Button>
        )}
        {!ready && <p className="text-xs opacity-70">Keep this page open. Order {orderId}</p>}
        <p className="mt-6 text-xs">
          Left by accident? <Link to="/crypto/recover">Connect your wallet</Link>
        </p>
      </section>
    </Layout>
  );
}
