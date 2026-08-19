import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { useLanguage } from "../contexts/LanguageContext";
import { claimCryptoActivation, listCryptoOrders, type CryptoOrderStatus } from "../services/api";
import {
  CRYPTO_ESCROW,
  CRYPTO_CHAINS,
  formatEscrowAmount,
  isCryptoChainId,
  listOnchainOrderIds,
  orderIdBytes32,
  pickEthereum,
  readEscrowSettlement,
  sendEscrowPayerTx,
  settlementFromOnchain,
  ensureChain,
  type CryptoChainId,
  type EscrowSettlement,
  type EthereumProvider,
} from "../hooks/useCryptoPurchase";

const CLAIM_TYPES = {
  ClaimActivation: [
    { name: "payer", type: "address" },
    { name: "orderId", type: "bytes32" },
    { name: "issuedAt", type: "uint256" },
  ],
};

const CHAINS: CryptoChainId[] = [80002, 11155111];

type ManagedOrder = {
  orderId: string;
  idBytes32: string;
  chainId: CryptoChainId;
  escrow: string;
  paid: boolean;
  provisioned: boolean;
  claimed: boolean;
  canClaim: boolean;
  label: string | null;
  status: string;
  settlement: EscrowSettlement | null;
};

type ActionKind = "cancel" | "withdraw" | "claim";

function isUuidOrder(orderId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
}

function bytes32Of(orderId: string): string {
  if (orderId.startsWith("0x") && orderId.length === 66) return orderId.toLowerCase();
  return orderIdBytes32(orderId);
}

function asChainId(value: number): CryptoChainId | null {
  return isCryptoChainId(value) ? value : null;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatWhen(ts: number, lang: "en" | "he"): string {
  return new Date(ts * 1000).toLocaleDateString(lang === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function needsProvisionPoll(orders: ManagedOrder[]) {
  return orders.some((order) => order.paid && !order.provisioned);
}

async function settlementFor(
  chainId: CryptoChainId,
  escrow: string,
  idBytes32: string,
  snap: CryptoOrderStatus["escrowState"],
  injected?: EthereumProvider,
): Promise<EscrowSettlement | null> {
  if (snap) {
    try {
      return settlementFromOnchain(chainId, snap);
    } catch {
      // Fall through to a wallet or RPC read.
    }
  }
  try {
    let runner: ethers.providers.Provider | undefined;
    if (injected) {
      await ensureChain(injected, chainId);
      runner = new ethers.providers.Web3Provider(injected as ethers.providers.ExternalProvider);
    }
    return await readEscrowSettlement(chainId, escrow, idBytes32, runner);
  } catch {
    return null;
  }
}

async function loadManaged(address: string, injected?: EthereumProvider): Promise<ManagedOrder[]> {
  const listed = await listCryptoOrders(address).catch(() => ({ orders: [] as CryptoOrderStatus[] }));
  const byId = new Map<string, ManagedOrder>();

  for (const order of listed.orders) {
    const chainId = asChainId(Number(order.chainId));
    if (!chainId) continue;
    const escrow = order.escrow || CRYPTO_ESCROW[chainId];
    const idBytes32 = bytes32Of(order.orderId);
    const claimed = Boolean(order.claimed);
    const settlement = await settlementFor(chainId, escrow, idBytes32, order.escrowState, injected);
    byId.set(`${chainId}:${idBytes32.toLowerCase()}`, {
      orderId: order.orderId,
      idBytes32,
      chainId,
      escrow,
      paid: order.paid,
      provisioned: order.provisioned,
      claimed,
      canClaim: order.provisioned && isUuidOrder(order.orderId) && !claimed,
      label: order.label || null,
      status: order.status,
      settlement,
    });
  }

  if (byId.size === 0 && injected) {
    await Promise.all(
      CHAINS.map(async (chainId) => {
        const escrow = CRYPTO_ESCROW[chainId];
        const ids = await listOnchainOrderIds(chainId, escrow, address).catch(() => [] as string[]);
        for (const idBytes32 of ids) {
          const key = `${chainId}:${idBytes32.toLowerCase()}`;
          if (byId.has(key)) continue;
          const settlement = await settlementFor(chainId, escrow, idBytes32, null, injected);
          if (!settlement) continue;
          byId.set(key, {
            orderId: idBytes32,
            idBytes32,
            chainId,
            escrow,
            paid: true,
            provisioned: false,
            claimed: false,
            canClaim: false,
            label: null,
            status: "onchain",
            settlement,
          });
        }
      }),
    );
  }

  return [...byId.values()];
}

export function CryptoRecoverPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const copy = t.crypto;
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [payer, setPayer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [action, setAction] = useState<{ orderId: string; kind: ActionKind } | null>(null);
  const payerRef = useRef<string | null>(null);

  useEffect(() => {
    payerRef.current = payer;
  }, [payer]);

  const refresh = useCallback(async (address: string) => {
    setLoadingList(true);
    try {
      const injected = await pickEthereum().catch(() => undefined);
      const next = await loadManaged(address, injected);
      if (payerRef.current?.toLowerCase() === address.toLowerCase()) {
        setOrders(next);
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  const connect = useCallback(async (request = true) => {
    setConnecting(true);
    setError(null);
    try {
      const injected = await pickEthereum();
      const accounts = await injected.request({
        method: request ? "eth_requestAccounts" : "eth_accounts",
      });
      const address = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      if (!address) {
        if (!request) return;
        throw new Error("No wallet account");
      }
      payerRef.current = address;
      setPayer(address);
      await refresh(address);
    } catch (err) {
      if (request) {
        setError(err instanceof Error ? err.message : "Connect failed");
      }
    } finally {
      setConnecting(false);
    }
  }, [refresh]);

  useEffect(() => {
    void connect(false);
  }, [connect]);

  useEffect(() => {
    if (!payer || !needsProvisionPoll(orders)) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      void (async () => {
        const address = payerRef.current;
        if (!address) return;
        try {
          const result = await listCryptoOrders(address);
          if (cancelled) return;
          setOrders((current) =>
            current.map((order) => {
              const match = result.orders.find((item) => item.orderId === order.orderId);
              if (!match) return order;
              return {
                ...order,
                paid: match.paid,
                provisioned: match.provisioned,
                claimed: Boolean(match.claimed),
                label: match.label || order.label,
                canClaim: match.provisioned && isUuidOrder(order.orderId) && !match.claimed,
                status: match.status,
                escrow: match.escrow || order.escrow,
                settlement:
                  match.escrowState && asChainId(Number(match.chainId))
                    ? settlementFromOnchain(asChainId(Number(match.chainId)) as CryptoChainId, match.escrowState)
                    : order.settlement,
              };
            }),
          );
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

  async function runPayerTx(order: ManagedOrder, method: "cancel" | "withdrawUnused") {
    setAction({ orderId: order.orderId, kind: method === "cancel" ? "cancel" : "withdraw" });
    setError(null);
    try {
      await sendEscrowPayerTx(order.chainId, order.escrow, order.idBytes32, method);
      if (method === "cancel" && payerRef.current) {
        await listCryptoOrders(payerRef.current).catch(() => undefined);
      }
      const settlement = await settlementFor(order.chainId, order.escrow, order.idBytes32);
      setOrders((current) =>
        current.map((item) => (item.orderId === order.orderId ? { ...item, settlement } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setAction(null);
    }
  }

  async function claim(order: ManagedOrder) {
    setAction({ orderId: order.orderId, kind: "claim" });
    setError(null);
    try {
      if (!order.escrow) throw new Error("Missing escrow for this order.");
      const injected = await pickEthereum();
      const web3 = new ethers.providers.Web3Provider(injected as ethers.providers.ExternalProvider);
      const signer = web3.getSigner();
      const signerPayer = await signer.getAddress();
      const issuedAt = Math.floor(Date.now() / 1000);
      const signature = await signer._signTypedData(
        {
          name: "SecnumCryptoClaim",
          version: "1",
          chainId: order.chainId,
          verifyingContract: order.escrow,
        },
        CLAIM_TYPES,
        { payer: signerPayer, orderId: order.idBytes32, issuedAt },
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
      setAction(null);
    }
  }

  const connected = Boolean(payer);
  const busy = connecting || Boolean(action);

  return (
    <Layout hideAppStoreBadges>
      <section className="crypto-checkout">
        <div className="crypto-checkout-frame">
          <p className="crypto-checkout-back">
            <Link to="/crypto">{copy.back}</Link>
          </p>
          <p className="crypto-checkout-kicker">{copy.kicker}</p>
          <h1>{copy.manageTitle}</h1>
          <p className="crypto-checkout-lead">{copy.manageLead}</p>

          <div className="crypto-checkout-wallet">
            <span
              className={`crypto-checkout-wallet-dot${connected ? " is-on" : ""}`}
              aria-hidden="true"
            />
            <p className="crypto-checkout-wallet-copy">
              {connected && payer ? (
                <strong>{copy.manageConnected(shortAddress(payer))}</strong>
              ) : (
                copy.walletOff
              )}
            </p>
          </div>

          {error && (
            <p className="crypto-checkout-error" role="alert">
              {error}
            </p>
          )}

          {!connected && (
            <Button onClick={() => void connect(true)} loading={connecting} disabled={connecting}>
              {connecting ? copy.connecting : copy.connect}
            </Button>
          )}

          {connected && loadingList && orders.length === 0 && (
            <p className="crypto-checkout-amount">{copy.quoteLoading}</p>
          )}

          {connected && !loadingList && orders.length === 0 && (
            <p className="crypto-checkout-amount">{copy.noOrders}</p>
          )}

          {orders.length > 0 && (
            <ul className="crypto-checkout-orders">
              {orders.map((order) => {
                const settlement = order.settlement;
                const symbol = settlement?.symbol || CRYPTO_CHAINS[order.chainId].nativeCurrency.symbol;
                const acting = action?.orderId === order.orderId;
                const statusLabel = order.provisioned
                  ? copy.statusReady
                  : order.paid
                    ? copy.statusProvisioning
                    : order.status;
                return (
                  <li key={`${order.chainId}:${order.idBytes32}`} className="crypto-checkout-order">
                    <p className="crypto-checkout-order-status">
                      {order.label ? copy.numberLabel(order.label) : statusLabel}
                    </p>
                    <p className="crypto-checkout-order-id">
                      {order.chainId === 80002 ? copy.amoy : copy.sepolia}
                      {" · "}
                      {order.label ? statusLabel : order.orderId}
                    </p>
                    {order.claimed && (
                      <p className="crypto-checkout-order-status">{copy.claimedDone}</p>
                    )}
                    <ul className="crypto-checkout-order-split">
                      {settlement ? (
                        <>
                          {settlement.providerWithdrawable > 0n && (
                            <li>
                              {copy.cellactNow(
                                formatEscrowAmount(settlement.providerWithdrawable, symbol),
                                symbol,
                              )}
                            </li>
                          )}
                          {settlement.canWithdrawUnused ? (
                            <li>
                              {copy.youCanWithdraw(
                                formatEscrowAmount(settlement.payerUnusedNow, symbol),
                                symbol,
                              )}
                            </li>
                          ) : (
                            <li>{copy.nothingBackYet}</li>
                          )}
                          {settlement.canCancel && (
                            <li>
                              {copy.ifCancel(
                                formatWhen(settlement.ifCancelEffectiveAt, lang),
                                formatEscrowAmount(settlement.payerUnusedIfCancel, symbol),
                                formatEscrowAmount(settlement.providerKeepsIfCancel, symbol),
                                symbol,
                              )}
                            </li>
                          )}
                          {settlement.cancelAlreadySet && !settlement.cancelIsEffective && (
                            <li>{copy.cancelScheduled(formatWhen(settlement.cancelEffectiveAt, lang))}</li>
                          )}
                        </>
                      ) : (
                        <li>{copy.escrowUnread}</li>
                      )}
                    </ul>
                    <div className="crypto-checkout-order-actions">
                      {settlement?.canCancel && (
                        <Button
                          variant="secondary"
                          onClick={() => void runPayerTx(order, "cancel")}
                          loading={acting && action?.kind === "cancel"}
                          disabled={busy}
                        >
                          {acting && action?.kind === "cancel" ? copy.waitWallet : copy.cancelCta}
                        </Button>
                      )}
                      {settlement && (
                        <Button
                          variant="secondary"
                          onClick={() => void runPayerTx(order, "withdrawUnused")}
                          loading={acting && action?.kind === "withdraw"}
                          disabled={busy || !settlement.canWithdrawUnused}
                        >
                          {acting && action?.kind === "withdraw" ? copy.waitWallet : copy.withdrawCta}
                        </Button>
                      )}
                      {order.canClaim && (
                        <Button
                          onClick={() => void claim(order)}
                          loading={acting && action?.kind === "claim"}
                          disabled={busy}
                        >
                          {acting && action?.kind === "claim" ? copy.waitWallet : copy.claimCta}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
}
