import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  signAndRelayCancel,
  settlementFromOnchain,
  ensureChain,
  escrowTxUrl,
  cryptoErrorCopy,
  logCryptoError,
  discoverWallets,
  storedWalletKind,
  storeWalletKind,
  clearWalletKind,
  signerFromInjected,
  type CryptoChainId,
  type EscrowSettlement,
  type EthereumProvider,
  type DiscoveredWallet,
  type WalletKind,
} from "../hooks/useCryptoPurchase";
import { CryptoWalletPick, PAYMYEMAIL_SITE } from "./CryptoPage";

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
  tokenSymbol: string | null;
  settlement: EscrowSettlement | null;
  cancelTxHash?: string | null;
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

type OrderTone = "live" | "provisioning" | "cancelled";

function orderKey(order: ManagedOrder): string {
  return `${order.chainId}:${order.idBytes32.toLowerCase()}`;
}

function toneOf(order: ManagedOrder): OrderTone {
  if (order.settlement?.cancelAlreadySet) return "cancelled";
  if (order.provisioned) return "live";
  return "provisioning";
}

function markLetter(order: ManagedOrder): string {
  const digits = (order.label || "").replace(/\D/g, "");
  if (digits.length > 0) return digits[0];
  if (order.label) return order.label[0].toUpperCase();
  return "P";
}

function shortRef(orderId: string): string {
  if (orderId.startsWith("0x") && orderId.length === 66) {
    return `${orderId.slice(0, 6)}…${orderId.slice(-4)}`;
  }
  if (orderId.length > 12) return `${orderId.slice(0, 8)}…`;
  return orderId;
}

function paidLine(order: ManagedOrder): string | null {
  const symbol =
    order.settlement?.symbol ||
    order.tokenSymbol ||
    CRYPTO_CHAINS[order.chainId].nativeCurrency.symbol;
  if (order.settlement) {
    return `${formatEscrowAmount(order.settlement.paidTotal, symbol)} ${symbol}`;
  }
  return symbol || null;
}

function untilTs(order: ManagedOrder): number | null {
  const settlement = order.settlement;
  if (!settlement) return null;
  if (settlement.cancelAlreadySet && settlement.cancelEffectiveAt) {
    return settlement.cancelEffectiveAt;
  }
  const period =
    settlement.elapsedPeriods > 0
      ? Math.floor(settlement.elapsedSeconds / settlement.elapsedPeriods)
      : 2_592_000;
  return settlement.startAt + settlement.termPeriods * period;
}

function formatElapsed(seconds: number, lang: "en" | "he"): string {
  const days = Math.max(0, Math.floor(seconds / 86400));
  if (lang === "he") {
    if (days === 0) return "פחות מיום";
    if (days === 1) return "יום אחד";
    return `${days} ימים`;
  }
  if (days === 0) return "less than a day";
  if (days === 1) return "1 day";
  return `${days} days`;
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
  try {
    const live = await readEscrowSettlement(chainId, escrow, idBytes32);
    if (live) return live;
  } catch {
    // Public RPC can be busy; fall through.
  }
  if (snap) {
    try {
      return settlementFromOnchain(chainId, snap);
    } catch {
      // Fall through to the wallet RPC.
    }
  }
  if (injected) {
    try {
      await ensureChain(injected, chainId);
      const runner = new ethers.providers.Web3Provider(injected as ethers.providers.ExternalProvider);
      const live = await readEscrowSettlement(chainId, escrow, idBytes32, runner);
      if (live) return live;
    } catch {
      // Wallet RPC can fail on the wrong chain.
    }
  }
  return null;
}

async function readCancelledSettlement(
  chainId: CryptoChainId,
  escrow: string,
  idBytes32: string,
): Promise<EscrowSettlement | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const settlement = await readEscrowSettlement(chainId, escrow, idBytes32).catch(() => null);
    if (settlement?.cancelAlreadySet) return settlement;
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
  }
  return readEscrowSettlement(chainId, escrow, idBytes32).catch(() => null);
}

function withCancelApplied(
  settlement: EscrowSettlement | null,
  cancelEffective?: number,
): EscrowSettlement | null {
  if (!settlement || !cancelEffective) return settlement;
  if (settlement.cancelAlreadySet) return settlement;
  return {
    ...settlement,
    cancelAlreadySet: true,
    canCancel: false,
    canWithdrawUnused: false,
    cancelEffectiveAt: cancelEffective,
    ifCancelEffectiveAt: cancelEffective,
  };
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
      tokenSymbol: order.tokenSymbol || null,
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
            tokenSymbol: settlement.symbol,
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
  const [params, setParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const copy = t.crypto;
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [payer, setPayer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [action, setAction] = useState<{ orderId: string; kind: ActionKind } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const payerRef = useRef<string | null>(null);
  const focusKey = params.get("o");
  const selected = orders.find((order) => orderKey(order) === focusKey) ?? null;

  useEffect(() => {
    payerRef.current = payer;
  }, [payer]);

  const refresh = useCallback(async (address: string) => {
    setLoadingList(true);
    try {
      const injected = await pickEthereum(address).catch(() => undefined);
      const next = await loadManaged(address, injected);
      if (payerRef.current?.toLowerCase() === address.toLowerCase()) {
        setOrders(next);
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  const connectSilent = useCallback(async () => {
    const kind = storedWalletKind();
    if (!kind) return;
    setConnecting(true);
    try {
      const injected = await pickEthereum(undefined, kind);
      const accounts = await injected.request({ method: "eth_accounts" });
      const address = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      if (!address) return;
      payerRef.current = address;
      setPayer(address);
      await refresh(address);
    } catch {
      // Stay disconnected until the user picks a wallet.
    } finally {
      setConnecting(false);
    }
  }, [refresh]);

  const connectKind = useCallback(async (kind: WalletKind) => {
    setConnecting(true);
    setError(null);
    try {
      const list = await discoverWallets();
      setWallets(list);
      if (!list.find((item) => item.kind === kind)?.available) {
        setError(kind === "paymyemail" ? copy.installPayMyEmail : copy.installMetaMask);
        return;
      }
      storeWalletKind(kind);
      const injected = await pickEthereum(undefined, kind);
      injected.on?.("accountsChanged", (...args: unknown[]) => {
        const next = Array.isArray(args[0]) && typeof args[0][0] === "string" ? args[0][0] : null;
        payerRef.current = next;
        setPayer(next);
        if (next) void refresh(next);
        else setOrders([]);
      });
      const accounts = await injected.request({ method: "eth_requestAccounts" });
      const address = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      if (!address) throw new Error("No wallet account");
      payerRef.current = address;
      setPayer(address);
      setPicking(false);
      await refresh(address);
    } catch (err) {
      logCryptoError("recover-connect", err);
      setError(cryptoErrorCopy(copy, err));
    } finally {
      setConnecting(false);
    }
  }, [copy, refresh]);

  useEffect(() => {
    void connectSilent();
  }, [connectSilent]);

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
              const chainId = asChainId(Number(match.chainId));
              let settlement = order.settlement;
              if (match.escrowState && chainId) {
                const next = settlementFromOnchain(chainId, match.escrowState);
                if (!(order.settlement?.cancelAlreadySet && !next.cancelAlreadySet)) {
                  settlement = next;
                }
              }
              return {
                ...order,
                paid: match.paid,
                provisioned: match.provisioned,
                claimed: Boolean(match.claimed),
                label: match.label || order.label,
                canClaim: match.provisioned && isUuidOrder(order.orderId) && !match.claimed,
                status: match.status,
                escrow: match.escrow || order.escrow,
                settlement,
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
    if (method === "cancel") {
      const live = await readEscrowSettlement(order.chainId, order.escrow, order.idBytes32).catch(
        () => null,
      );
      if (live?.cancelAlreadySet || (order.settlement && !order.settlement.canCancel)) {
        const settlement = withCancelApplied(
          live || order.settlement,
          live?.cancelEffectiveAt || order.settlement?.cancelEffectiveAt,
        );
        setOrders((current) =>
          current.map((item) => (item.orderId === order.orderId ? { ...item, settlement } : item)),
        );
        setConfirmingId(null);
        setError(null);
        return;
      }
    }
    if (method === "withdrawUnused" && order.settlement && !order.settlement.canWithdrawUnused) {
      setError(copy.nothingToWithdraw);
      return;
    }
    setAction({ orderId: order.orderId, kind: method === "cancel" ? "cancel" : "withdraw" });
    setError(null);
    try {
      const payer = payerRef.current || undefined;
      let txHash: string | null = null;
      let resultCancelEffective: number | undefined;
      if (method === "cancel") {
        const result = await signAndRelayCancel(
          order.chainId,
          order.escrow,
          order.orderId,
          order.idBytes32,
          payer,
        );
        txHash = result.txHash;
        resultCancelEffective = result.cancelEffective;
      } else {
        txHash = await sendEscrowPayerTx(order.chainId, order.escrow, order.idBytes32, method, payer);
      }
      const live =
        method === "cancel"
          ? (await readEscrowSettlement(order.chainId, order.escrow, order.idBytes32).catch(
              () => null,
            )) ||
            (resultCancelEffective
              ? null
              : await readCancelledSettlement(order.chainId, order.escrow, order.idBytes32))
          : await settlementFor(order.chainId, order.escrow, order.idBytes32, null);
      const settlement =
        method === "cancel"
          ? withCancelApplied(live || order.settlement, resultCancelEffective) || live
          : live;
      setOrders((current) =>
        current.map((item) =>
          item.orderId === order.orderId
            ? { ...item, settlement, cancelTxHash: txHash || item.cancelTxHash }
            : item,
        ),
      );
    } catch (err) {
      if (method === "cancel") {
        const live = await readCancelledSettlement(order.chainId, order.escrow, order.idBytes32);
        const settlement = withCancelApplied(live || order.settlement, order.settlement?.cancelEffectiveAt);
        if (settlement?.cancelAlreadySet) {
          setOrders((current) =>
            current.map((item) => (item.orderId === order.orderId ? { ...item, settlement } : item)),
          );
        } else {
          setError(cryptoErrorCopy(copy, err));
        }
      } else {
        setError(cryptoErrorCopy(copy, err));
      }
    } finally {
      setAction(null);
      setConfirmingId(null);
    }
  }

  async function claim(order: ManagedOrder) {
    setAction({ orderId: order.orderId, kind: "claim" });
    setError(null);
    try {
      if (!order.escrow) throw new Error("Missing escrow for this order.");
      const injected = await pickEthereum(payerRef.current || undefined);
      const { signer, address: signerPayer } = await signerFromInjected(
        injected,
        payerRef.current || undefined,
      );
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
      logCryptoError("claim", err);
      setError(cryptoErrorCopy(copy, err));
    } finally {
      setAction(null);
    }
  }

  const connected = Boolean(payer);
  const busy = connecting || Boolean(action);

  function openOrder(order: ManagedOrder) {
    setError(null);
    setConfirmingId(null);
    setParams((current) => {
      const next = new URLSearchParams();
      const langParam = current.get("lang");
      if (langParam === "he" || langParam === "en") next.set("lang", langParam);
      next.set("o", orderKey(order));
      return next;
    });
  }

  function closeOrder() {
    setError(null);
    setConfirmingId(null);
    setParams((current) => {
      const next = new URLSearchParams();
      const langParam = current.get("lang");
      if (langParam === "he" || langParam === "en") next.set("lang", langParam);
      return next;
    });
  }

  return (
    <Layout hideAppStoreBadges>
      <section className={`crypto-checkout${orders.length > 0 ? " is-orders" : ""}`}>
        <div className={`crypto-checkout-frame${orders.length > 0 ? " is-orders" : ""}`}>
          <p className="crypto-checkout-back">
            {selected ? (
              <button type="button" onClick={closeOrder}>
                {copy.backToOrders}
              </button>
            ) : (
              <Link to="/crypto">{copy.back}</Link>
            )}
          </p>
          <p className="crypto-checkout-kicker">{copy.kicker}</p>
          <h1>{selected ? orderTitle(selected, copy) : copy.manageTitle}</h1>
          {!selected && <p className="crypto-checkout-lead">{copy.manageLead}</p>}

          <div className="crypto-checkout-wallet">
            <span
              className={`crypto-checkout-wallet-dot${connected ? " is-on" : ""}`}
              aria-hidden="true"
            />
            <p className="crypto-checkout-wallet-copy">
              {connected && payer ? (
                <strong>{copy.manageConnected(shortAddress(payer))}</strong>
              ) : picking ? (
                copy.chooseWallet
              ) : (
                copy.walletOff
              )}
            </p>
            {connected ? (
              <button
                type="button"
                className="crypto-checkout-wallet-action"
                onClick={() => {
                  clearWalletKind();
                  setPayer(null);
                  payerRef.current = null;
                  setOrders([]);
                  setPicking(true);
                  void discoverWallets().then(setWallets);
                }}
              >
                {copy.changeWallet}
              </button>
            ) : null}
          </div>

          {picking && !connected && (
            <CryptoWalletPick
              wallets={wallets}
              connecting={connecting}
              copy={copy}
              onPick={(kind) => void connectKind(kind)}
            />
          )}

          {error && (
            <p className="crypto-checkout-error" role="alert">
              <span>{error}</span>
              {error === copy.installPayMyEmail && (
                <a href={PAYMYEMAIL_SITE} target="_blank" rel="noreferrer">
                  {copy.whatIsPayMyEmail}
                </a>
              )}
            </p>
          )}

          {!connected && !picking && (
            <Button
              onClick={() => {
                setPicking(true);
                void discoverWallets().then(setWallets);
              }}
              loading={connecting}
              disabled={connecting}
            >
              {connecting ? copy.connecting : copy.connect}
            </Button>
          )}

          {connected && loadingList && orders.length === 0 && (
            <p className="crypto-checkout-amount">{copy.quoteLoading}</p>
          )}

          {connected && !loadingList && orders.length === 0 && (
            <p className="crypto-checkout-amount">{copy.noOrders}</p>
          )}

          {orders.length > 0 && selected && (
            <OrderDetail
              order={selected}
              copy={copy}
              lang={lang}
              busy={busy}
              action={action}
              confirming={confirmingId === selected.orderId}
              onConfirm={() => {
                setError(null);
                setConfirmingId(selected.orderId);
              }}
              onKeep={() => setConfirmingId(null)}
              onCancel={() => void runPayerTx(selected, "cancel")}
              onWithdraw={() => void runPayerTx(selected, "withdrawUnused")}
              onClaim={() => void claim(selected)}
              onBack={closeOrder}
            />
          )}

          {orders.length > 0 && !selected && (
            <OrderTable orders={orders} copy={copy} lang={lang} onOpen={openOrder} />
          )}
        </div>
      </section>
    </Layout>
  );
}

function orderTitle(
  order: ManagedOrder,
  copy: { numberLabel: (label: string) => string; statusProvisioning: string },
): string {
  return order.label ? copy.numberLabel(order.label) : copy.statusProvisioning;
}

function toneLabel(
  tone: OrderTone,
  copy: { statusLive: string; statusProvisioning: string; statusCancelled: string },
): string {
  if (tone === "cancelled") return copy.statusCancelled;
  if (tone === "live") return copy.statusLive;
  return copy.statusProvisioning;
}

function StatusPill({
  order,
  copy,
}: {
  order: ManagedOrder;
  copy: { statusLive: string; statusProvisioning: string; statusCancelled: string };
}) {
  const tone = toneOf(order);
  return <span className={`crypto-status is-${tone}`}>{toneLabel(tone, copy)}</span>;
}

function OrderTable({
  orders,
  copy,
  lang,
  onOpen,
}: {
  orders: ManagedOrder[];
  copy: {
    colNumber: string;
    colPaid: string;
    network: string;
    colStatus: string;
    colUntil: string;
    untilEmpty: string;
    amoy: string;
    sepolia: string;
    numberLabel: (label: string) => string;
    statusProvisioning: string;
    statusLive: string;
    statusCancelled: string;
  };
  lang: "en" | "he";
  onOpen: (order: ManagedOrder) => void;
}) {
  return (
    <div className="crypto-order-table-wrap">
      <table className="crypto-order-table">
        <thead>
          <tr>
            <th>{copy.colNumber}</th>
            <th>{copy.colPaid}</th>
            <th>{copy.colStatus}</th>
            <th className="is-desk">{copy.colUntil}</th>
          </tr>
        </thead>
        <tbody>
          {[...orders]
            .sort((a, b) => {
              const rank = { live: 0, provisioning: 1, cancelled: 2 };
              return rank[toneOf(a)] - rank[toneOf(b)];
            })
            .map((order) => {
            const ends = untilTs(order);
            const network = order.chainId === 80002 ? copy.amoy : copy.sepolia;
            const paid = paidLine(order);
            return (
              <tr
                key={orderKey(order)}
                tabIndex={0}
                role="button"
                onClick={() => onOpen(order)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(order);
                  }
                }}
              >
                <td>
                  <span className="crypto-order-cell">
                    <span
                      className={`crypto-order-mark is-${order.chainId === 80002 ? "amoy" : "sepolia"}`}
                      aria-hidden="true"
                    >
                      {markLetter(order)}
                    </span>
                    <span className="crypto-order-name">
                      <strong>{orderTitle(order, copy)}</strong>
                      <small>
                        {network}
                        {" · "}
                        {shortRef(order.orderId)}
                      </small>
                    </span>
                  </span>
                </td>
                <td className="crypto-order-paid">
                  {paid || copy.untilEmpty}
                </td>
                <td>
                  <StatusPill order={order} copy={copy} />
                </td>
                <td className="is-desk">{ends ? formatWhen(ends, lang) : copy.untilEmpty}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrderDetail({
  order,
  copy,
  lang,
  busy,
  action,
  confirming,
  onConfirm,
  onKeep,
  onCancel,
  onWithdraw,
  onClaim,
  onBack,
}: {
  order: ManagedOrder;
  copy: {
    amoy: string;
    sepolia: string;
    statusLive: string;
    statusProvisioning: string;
    statusCancelled: string;
    claimedDone: string;
    youCanWithdraw: (amount: string, symbol: string) => string;
    cancelledReturned: (date: string) => string;
    fundsBack: (date: string) => string;
    viewTx: string;
    backToOrders: string;
    escrowUnread: string;
    cancelSummaryTitle: string;
    timePassed: (elapsed: string) => string;
    timePaid: (date: string) => string;
    refundNow: (amount: string, symbol: string, months: number) => string;
    waitWallet: string;
    confirmCancel: string;
    keepNumber: string;
    cancelCta: string;
    withdrawCta: string;
    claimCta: string;
  };
  lang: "en" | "he";
  busy: boolean;
  action: { orderId: string; kind: ActionKind } | null;
  confirming: boolean;
  onConfirm: () => void;
  onKeep: () => void;
  onCancel: () => void;
  onWithdraw: () => void;
  onClaim: () => void;
  onBack: () => void;
}) {
  const paid = paidLine(order);
  const settlement = order.settlement;
  const symbol = settlement?.symbol || CRYPTO_CHAINS[order.chainId].nativeCurrency.symbol;
  const acting = action?.orderId === order.orderId;
  const network = order.chainId === 80002 ? copy.amoy : copy.sepolia;
  const ends = untilTs(order);
  const cancelled = Boolean(settlement?.cancelAlreadySet);
  const txUrl = order.cancelTxHash ? escrowTxUrl(order.chainId, order.cancelTxHash) : null;

  return (
    <div className="crypto-order-focus">
      <div className="crypto-order-focus-head">
        <StatusPill order={order} copy={copy} />
        <p className="crypto-order-focus-meta">
          {network}
          {paid ? ` · ${paid}` : ""}
          {ends ? ` · ${formatWhen(ends, lang)}` : ""}
        </p>
      </div>
      {order.claimed && <p className="crypto-order-focus-note">{copy.claimedDone}</p>}
      {cancelled && settlement ? (
        <div className="crypto-order-focus-done">
          <p>
            <span className="crypto-order-focus-check" aria-hidden="true">
              ✓
            </span>
            {copy.fundsBack(formatWhen(settlement.cancelEffectiveAt, lang))}
          </p>
          {txUrl && (
            <p>
              <a href={txUrl} target="_blank" rel="noreferrer">
                {copy.viewTx}
              </a>
            </p>
          )}
          <Button onClick={onBack}>{copy.backToOrders}</Button>
        </div>
      ) : settlement?.canWithdrawUnused || !settlement ? (
        <ul className="crypto-checkout-order-split">
          {settlement ? (
            <li>
              {copy.youCanWithdraw(formatEscrowAmount(settlement.payerUnusedNow, symbol), symbol)}
            </li>
          ) : (
            <li>{copy.escrowUnread}</li>
          )}
        </ul>
      ) : null}
      <div className="crypto-checkout-order-actions">
        {settlement?.canCancel && !cancelled && confirming && (
          <>
            <p className="crypto-checkout-order-status">{copy.cancelSummaryTitle}</p>
            <ul className="crypto-checkout-order-split">
              <li>{copy.timePassed(formatElapsed(settlement.elapsedSeconds, lang))}</li>
              <li>{copy.timePaid(formatWhen(settlement.ifCancelEffectiveAt, lang))}</li>
              <li>
                {copy.refundNow(
                  formatEscrowAmount(settlement.payerUnusedIfCancel, symbol),
                  symbol,
                  settlement.unusedPeriodsIfCancel,
                )}
              </li>
            </ul>
            <Button
              onClick={onCancel}
              loading={acting && action?.kind === "cancel"}
              disabled={busy}
            >
              {acting && action?.kind === "cancel" ? copy.waitWallet : copy.confirmCancel}
            </Button>
            <Button variant="secondary" onClick={onKeep} disabled={busy}>
              {copy.keepNumber}
            </Button>
          </>
        )}
        {settlement?.canCancel && !cancelled && !confirming && (
          <Button variant="secondary" onClick={onConfirm} disabled={busy}>
            {copy.cancelCta}
          </Button>
        )}
        {settlement?.canWithdrawUnused && (
          <Button
            variant="secondary"
            onClick={onWithdraw}
            loading={acting && action?.kind === "withdraw"}
            disabled={busy}
          >
            {acting && action?.kind === "withdraw" ? copy.waitWallet : copy.withdrawCta}
          </Button>
        )}
        {order.canClaim && (
          <Button
            onClick={onClaim}
            loading={acting && action?.kind === "claim"}
            disabled={busy}
          >
            {acting && action?.kind === "claim" ? copy.waitWallet : copy.claimCta}
          </Button>
        )}
      </div>
    </div>
  );
}
