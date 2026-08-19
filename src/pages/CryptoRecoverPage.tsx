import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { claimCryptoActivation, listCryptoOrders, type CryptoOrderStatus } from "../services/api";
import { pickEthereum } from "../hooks/useCryptoPurchase";

const CLAIM_TYPES = {
  ClaimActivation: [
    { name: "payer", type: "address" },
    { name: "orderId", type: "bytes32" },
    { name: "issuedAt", type: "uint256" },
  ],
};

function needsProvisionPoll(orders: CryptoOrderStatus[]) {
  return orders.some((order) => order.paid && !order.provisioned);
}

export function CryptoRecoverPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CryptoOrderStatus[]>([]);
  const [payer, setPayer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const payerRef = useRef<string | null>(null);

  useEffect(() => {
    payerRef.current = payer;
  }, [payer]);

  useEffect(() => {
    if (!payer || !needsProvisionPoll(orders)) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      void (async () => {
        const address = payerRef.current;
        if (!address) return;
        try {
          const result = await listCryptoOrders(address);
          if (!cancelled) setOrders(result.orders);
        } catch {
          // Keep the last snapshot; the next tick retries.
        }
      })();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [payer, orders]);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const injected = await pickEthereum();
      const web3 = new ethers.providers.Web3Provider(injected as ethers.providers.ExternalProvider);
      await web3.send("eth_requestAccounts", []);
      const address = await web3.getSigner().getAddress();
      const result = await listCryptoOrders(address);
      setPayer(address);
      setOrders(result.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusy(false);
    }
  }

  async function claim(order: CryptoOrderStatus) {
    setBusy(true);
    setError(null);
    try {
      if (!order.escrow) throw new Error("Missing escrow for this order.");
      const injected = await pickEthereum();
      const web3 = new ethers.providers.Web3Provider(injected as ethers.providers.ExternalProvider);
      const signer = web3.getSigner();
      const payer = await signer.getAddress();
      const issuedAt = Math.floor(Date.now() / 1000);
      const orderIdBytes32 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(order.orderId));
      const signature = await signer._signTypedData(
        {
          name: "SecnumCryptoClaim",
          version: "1",
          chainId: Number(order.chainId),
          verifyingContract: order.escrow,
        },
        CLAIM_TYPES,
        { payer, orderId: orderIdBytes32, issuedAt },
      );
      const { token } = await claimCryptoActivation({
        orderId: order.orderId,
        signature,
        issuedAt,
      });
      navigate(`/activate?token=${encodeURIComponent(token)}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <section className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-2xl font-semibold mb-3">Reconnect wallet</h1>
        <p className="text-sm mb-6">
          Connect the same account you paid with. If the payment succeeded, sign to get the Arnacon QR.
        </p>
        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
        <Button onClick={() => void connect()} loading={busy} disabled={busy}>
          Connect wallet
        </Button>
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.orderId} className="border rounded-xl p-4 text-sm">
              <div>{order.orderId}</div>
              <div>
                {order.provisioned ? "Ready" : order.paid ? "Provisioning" : order.status}
              </div>
              {order.provisioned && (
                <Button className="mt-3" onClick={() => void claim(order)} disabled={busy}>
                  Sign and show QR
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
