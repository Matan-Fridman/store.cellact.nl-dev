import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { createCryptoQuote, getCryptoStatus, type CryptoQuote } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import type { AsyncStatus } from "../types";

const SUBSCRIBE_ABI = [
  "function subscribe(bytes32 orderId, uint256 serviceId, address token, uint256 setupAmount, uint256[] periodAmounts, uint256 totalAmount, uint256 expiry, bytes signature, string orderRef) payable",
];
const ERC20_ABI = ["function approve(address spender, uint256 amount) returns (bool)"];

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isPayMyEmail?: boolean;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export type CryptoAsset = "native" | "usdc";
export type CryptoChainId = 80002 | 11155111;

export const CRYPTO_CHAINS: Record<
  CryptoChainId,
  {
    chainId: string;
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  }
> = {
  80002: {
    chainId: "0x13882",
    chainName: "Polygon Amoy",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://polygon-amoy.gateway.tenderly.co", "https://rpc-amoy.polygon.technology"],
    blockExplorerUrls: ["https://amoy.polygonscan.com"],
  },
  11155111: {
    chainId: "0xaa36a7",
    chainName: "Sepolia",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.gateway.tenderly.co", "https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
};

export async function pickEthereum(): Promise<EthereumProvider> {
  const announced: Array<{ info?: { rdns?: string }; provider: EthereumProvider }> = [];
  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent).detail as {
      info?: { rdns?: string };
      provider: EthereumProvider;
    };
    if (detail?.provider) announced.push(detail);
  };
  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((resolve) => window.setTimeout(resolve, 80));
  window.removeEventListener("eip6963:announceProvider", onAnnounce);
  const pme = announced.find(
    (item) => item.provider.isPayMyEmail || item.info?.rdns === "email.paymyemail.wallet",
  );
  const provider = pme?.provider || window.ethereum;
  if (!provider) {
    throw new Error("Install PayMyEmail or MetaMask to pay with crypto.");
  }
  return provider;
}

function providerErrorCode(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "number" ? code : undefined;
}

export async function ensureChain(injected: EthereumProvider, chainId: CryptoChainId): Promise<void> {
  const chain = CRYPTO_CHAINS[chainId];
  try {
    await injected.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chain.chainId }],
    });
  } catch (err) {
    const code = providerErrorCode(err);
    if (code !== 4902 && code !== -32603) throw err;
    await injected.request({
      method: "wallet_addEthereumChain",
      params: [chain],
    });
    await injected.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chain.chainId }],
    });
  }
}

function waitPath(orderId: string, chainId: CryptoChainId, lang: "en" | "he"): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const params = new URLSearchParams({
    order: orderId,
    chain: String(chainId),
    lang,
  });
  return `${base}crypto/wait?${params.toString()}`;
}

export const CRYPTO_ESCROW: Record<CryptoChainId, string> = {
  80002: "0xAacC72407Eb9d97a8DDf86cC22D1250752Bc4dFB",
  11155111: "0xAacC72407Eb9d97a8DDf86cC22D1250752Bc4dFB",
};

export function escrowExplorerUrl(chainId: CryptoChainId, address = CRYPTO_ESCROW[chainId]): string {
  const base = CRYPTO_CHAINS[chainId].blockExplorerUrls[0]?.replace(/\/$/, "") ?? "";
  return `${base}/address/${address}`;
}

export function shortHex(value: string): string {
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

const ESCROW_ACCOUNT_ABI = [
  "function subscriptions(bytes32 orderId) view returns (address payer, address provider, address token, uint256 serviceId, uint64 start, uint64 cancelEffective, uint32 periodSeconds, uint8 termPeriods, uint256 setupAmount, uint256 setupWithdrawn, uint256 periodsWithdrawn, bool exists)",
  "function getPeriodAmounts(bytes32 orderId) view returns (uint256[])",
  "function ordersOf(address payer) view returns (bytes32[])",
  "function cancel(bytes32 orderId)",
  "function withdrawUnused(bytes32 orderId)",
];

export function isCryptoChainId(value: number): value is CryptoChainId {
  return value === 80002 || value === 11155111;
}

const USDC_BY_CHAIN: Record<CryptoChainId, string> = {
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  80002: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
};

export function formatLockAmount(amount: string, symbol: string): string {
  const decimals = symbol === "USDC" ? 6 : 18;
  const raw = ethers.utils.formatUnits(amount, decimals);
  const value = Number(raw);
  if (!Number.isFinite(value)) return raw;
  if (symbol === "USDC") return value.toFixed(2);
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatEscrowAmount(amount: bigint, symbol: string): string {
  return formatLockAmount(amount.toString(), symbol);
}

export function orderIdBytes32(orderId: string): string {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(orderId));
}

function toBig(value: ethers.BigNumberish): bigint {
  return BigInt(ethers.BigNumber.from(value).toString());
}

function sumPeriods(periods: bigint[], from: bigint, toExclusive: bigint): bigint {
  let total = 0n;
  const start = Number(from);
  const end = Number(toExclusive);
  for (let i = start; i < end && i < periods.length; i += 1) {
    total += periods[i];
  }
  return total;
}

function elapsedPeriods(params: {
  start: bigint;
  cancelEffective: bigint;
  periodSeconds: bigint;
  termPeriods: bigint;
  now: bigint;
}): bigint {
  let t = params.now;
  if (params.cancelEffective !== 0n && t > params.cancelEffective) t = params.cancelEffective;
  if (t <= params.start) return 0n;
  let n = (t - params.start) / params.periodSeconds;
  if (n > params.termPeriods) n = params.termPeriods;
  return n;
}

function vestedPeriods(params: {
  start: bigint;
  cancelEffective: bigint;
  periodSeconds: bigint;
  termPeriods: bigint;
  now: bigint;
}): bigint {
  const elapsed = elapsedPeriods(params);
  if (params.cancelEffective === 0n) return elapsed;
  if (params.now < params.cancelEffective) return elapsed;
  let vested = elapsed;
  if (vested < params.termPeriods) {
    const cancelElapsed = (params.cancelEffective - params.start) / params.periodSeconds;
    if (cancelElapsed > vested) vested = cancelElapsed;
    if (vested > params.termPeriods) vested = params.termPeriods;
  }
  return vested;
}

function previewCancelEffective(params: {
  start: bigint;
  periodSeconds: bigint;
  termPeriods: bigint;
  now: bigint;
}): bigint {
  const elapsed = elapsedPeriods({
    ...params,
    cancelEffective: 0n,
  });
  if (elapsed >= params.termPeriods) return params.now;
  const sinceStart = params.now - params.start;
  if (sinceStart > 0n && sinceStart % params.periodSeconds === 0n) return params.now;
  return params.start + (elapsed + 1n) * params.periodSeconds;
}

export type EscrowSettlement = {
  symbol: string;
  cancelAlreadySet: boolean;
  cancelIsEffective: boolean;
  canCancel: boolean;
  canWithdrawUnused: boolean;
  startAt: number;
  nowAt: number;
  elapsedSeconds: number;
  elapsedPeriods: number;
  termPeriods: number;
  paidPeriodsIfCancel: number;
  unusedPeriodsIfCancel: number;
  cancelEffectiveAt: number;
  ifCancelEffectiveAt: number;
  providerWithdrawable: bigint;
  providerKeepsIfCancel: bigint;
  payerUnusedNow: bigint;
  payerUnusedIfCancel: bigint;
};

function tokenMeta(chainId: CryptoChainId, token: string): { symbol: string } {
  if (token === ethers.constants.AddressZero) {
    return { symbol: chainId === 11155111 ? "ETH" : "POL" };
  }
  if (token.toLowerCase() === USDC_BY_CHAIN[chainId].toLowerCase()) {
    return { symbol: "USDC" };
  }
  return { symbol: "TOKEN" };
}

export function settlementFromOnchain(
  chainId: CryptoChainId,
  snap: {
    token: string;
    start: ethers.BigNumberish;
    cancelEffective: ethers.BigNumberish;
    periodSeconds: ethers.BigNumberish;
    termPeriods: ethers.BigNumberish;
    setupAmount: ethers.BigNumberish;
    setupWithdrawn: ethers.BigNumberish;
    periodsWithdrawn: ethers.BigNumberish;
    periodAmounts: ethers.BigNumberish[];
    now: ethers.BigNumberish;
  },
): EscrowSettlement {
  const now = toBig(snap.now);
  const start = toBig(snap.start);
  const cancelEffective = toBig(snap.cancelEffective);
  const periodSeconds = toBig(snap.periodSeconds);
  const termPeriods = toBig(snap.termPeriods);
  const setupAmount = toBig(snap.setupAmount);
  const setupWithdrawn = toBig(snap.setupWithdrawn);
  const periodsWithdrawn = toBig(snap.periodsWithdrawn);
  const periods = snap.periodAmounts.map((value) => toBig(value));
  const clock = { start, cancelEffective, periodSeconds, termPeriods, now };
  const vestedNow = vestedPeriods(clock);
  const ifCancelAt =
    cancelEffective === 0n
      ? previewCancelEffective({ start, periodSeconds, termPeriods, now })
      : cancelEffective;
  const vestedIfCancel = vestedPeriods({
    ...clock,
    cancelEffective: ifCancelAt,
    now: ifCancelAt > now ? ifCancelAt : now,
  });
  const unusedNow =
    cancelEffective !== 0n && now >= cancelEffective
      ? sumPeriods(periods, vestedNow, BigInt(periods.length))
      : 0n;
  const elapsedCount = elapsedPeriods(clock);
  let paidIfCancel = (ifCancelAt - start) / periodSeconds;
  if (paidIfCancel > termPeriods) paidIfCancel = termPeriods;
  if (paidIfCancel < 0n) paidIfCancel = 0n;
  const unusedCount = termPeriods > paidIfCancel ? termPeriods - paidIfCancel : 0n;
  const meta = tokenMeta(chainId, String(snap.token));
  return {
    symbol: meta.symbol,
    cancelAlreadySet: cancelEffective !== 0n,
    cancelIsEffective: cancelEffective !== 0n && now >= cancelEffective,
    canCancel: cancelEffective === 0n,
    canWithdrawUnused: unusedNow > 0n,
    startAt: Number(start),
    nowAt: Number(now),
    elapsedSeconds: Number(now > start ? now - start : 0n),
    elapsedPeriods: Number(elapsedCount),
    termPeriods: Number(termPeriods),
    paidPeriodsIfCancel: Number(paidIfCancel),
    unusedPeriodsIfCancel: Number(unusedCount),
    cancelEffectiveAt: Number(cancelEffective),
    ifCancelEffectiveAt: Number(ifCancelAt),
    providerWithdrawable:
      (setupWithdrawn === 0n ? setupAmount : 0n) + sumPeriods(periods, periodsWithdrawn, vestedNow),
    providerKeepsIfCancel: setupAmount + sumPeriods(periods, 0n, vestedIfCancel),
    payerUnusedNow: unusedNow,
    payerUnusedIfCancel: sumPeriods(periods, vestedIfCancel, BigInt(periods.length)),
  };
}

export async function readEscrowSettlement(
  chainId: CryptoChainId,
  escrow: string,
  idBytes32: string,
  runner?: ethers.providers.Provider,
): Promise<EscrowSettlement | null> {
  const provider = runner ?? new ethers.providers.JsonRpcProvider(CRYPTO_CHAINS[chainId].rpcUrls[0]);
  const contract = new ethers.Contract(escrow, ESCROW_ACCOUNT_ABI, provider);
  const [sub, periodsRaw, block] = await Promise.all([
    contract.subscriptions(idBytes32),
    contract.getPeriodAmounts(idBytes32),
    provider.getBlock("latest"),
  ]);
  if (!sub.exists) return null;
  if (!block) throw new Error("RPC returned no block");
  return settlementFromOnchain(chainId, {
    token: String(sub.token),
    start: sub.start,
    cancelEffective: sub.cancelEffective,
    periodSeconds: sub.periodSeconds,
    termPeriods: sub.termPeriods,
    setupAmount: sub.setupAmount,
    setupWithdrawn: sub.setupWithdrawn,
    periodsWithdrawn: sub.periodsWithdrawn,
    periodAmounts: periodsRaw as ethers.BigNumber[],
    now: block.timestamp,
  });
}

const ESCROW_REVERT: Record<string, string> = {
  [ethers.utils.id("CancelAlreadySet()").slice(0, 10)]: "already_cancelled",
  [ethers.utils.id("NothingToWithdraw()").slice(0, 10)]: "nothing_to_withdraw",
  [ethers.utils.id("CancelNotEffective()").slice(0, 10)]: "nothing_to_withdraw",
  [ethers.utils.id("NotPayer()").slice(0, 10)]: "not_payer",
};

function revertCode(err: unknown): string | null {
  const blob = err instanceof Error ? `${err.message}\n${JSON.stringify(err)}` : JSON.stringify(err);
  const match = blob.match(/0x([0-9a-f]{8})\b/i);
  if (!match) return null;
  return ESCROW_REVERT[`0x${match[1].toLowerCase()}`] ?? null;
}

export function quoteMonthly(quote: {
  periodAmounts: string[];
  tokenSymbol: string;
}): { monthly: string; intro: string | null; introCount: number } {
  const periods = quote.periodAmounts;
  const last = periods[periods.length - 1] || "0";
  const first = periods[0] || last;
  let introCount = 0;
  if (first !== last) {
    for (const amount of periods) {
      if (amount !== first) break;
      introCount += 1;
    }
  }
  return {
    monthly: formatLockAmount(last, quote.tokenSymbol),
    intro: introCount > 0 ? formatLockAmount(first, quote.tokenSymbol) : null,
    introCount,
  };
}

export async function sendEscrowPayerTx(
  chainId: CryptoChainId,
  escrow: string,
  idBytes32: string,
  method: "cancel" | "withdrawUnused",
): Promise<void> {
  const injected = await pickEthereum();
  await ensureChain(injected, chainId);
  const web3 = new ethers.providers.Web3Provider(injected as ethers.providers.ExternalProvider);
  const contract = new ethers.Contract(escrow, ESCROW_ACCOUNT_ABI, web3.getSigner());
  try {
    const tx = (await contract[method](idBytes32)) as { wait: () => Promise<unknown> };
    await tx.wait();
  } catch (err) {
    const code = revertCode(err);
    if (code) {
      const mapped = new Error(code);
      mapped.name = "EscrowTxError";
      throw mapped;
    }
    throw err;
  }
}

export async function listOnchainOrderIds(
  chainId: CryptoChainId,
  escrow: string,
  payer: string,
): Promise<string[]> {
  const provider = new ethers.providers.JsonRpcProvider(CRYPTO_CHAINS[chainId].rpcUrls[0]);
  const contract = new ethers.Contract(escrow, ESCROW_ACCOUNT_ABI, provider);
  const ids = (await contract.ordersOf(payer)) as string[];
  return ids.map((id) => String(id));
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function describeWallet(injected: EthereumProvider): string {
  return injected.isPayMyEmail ? "PayMyEmail" : "Wallet";
}

function firstAccount(value: unknown): string | null {
  if (!Array.isArray(value) || typeof value[0] !== "string" || value[0].length === 0) {
    return null;
  }
  return value[0];
}

export function useCryptoPurchase() {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [quote, setQuote] = useState<CryptoQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  const rememberWallet = useCallback((injected: EthereumProvider, accounts: unknown) => {
    setAccount(firstAccount(accounts));
    setWalletName(describeWallet(injected));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let injected: EthereumProvider | undefined;
    const onAccountsChanged = (...args: unknown[]) => {
      setAccount(firstAccount(args[0]));
    };

    void (async () => {
      try {
        const provider = await pickEthereum();
        if (cancelled) return;
        injected = provider;
        injected.on?.("accountsChanged", onAccountsChanged);
        const accounts = await injected.request({ method: "eth_accounts" });
        if (!cancelled) rememberWallet(injected, accounts);
      } catch {
        if (!cancelled) {
          setAccount(null);
          setWalletName(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      injected?.removeListener?.("accountsChanged", onAccountsChanged);
    };
  }, [rememberWallet]);

  const loadQuote = useCallback(async (chainId: CryptoChainId, token: CryptoAsset) => {
    setQuoteLoading(true);
    setError(null);
    try {
      const next = await createCryptoQuote({ chainId, token });
      setQuote(next);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Quote failed";
      setQuote(null);
      setError(message);
      setStatus("error");
      throw err;
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const injected = await pickEthereum();
      const accounts = await injected.request({ method: "eth_requestAccounts" });
      rememberWallet(injected, accounts);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wallet connect failed";
      setError(message);
      setStatus("error");
    } finally {
      setConnecting(false);
    }
  }, [rememberWallet]);

  const initiate = useCallback(
    async (chainId: CryptoChainId, token: CryptoAsset) => {
      setStatus("loading");
      setError(null);
      try {
        const injected = await pickEthereum();
        const accounts = await injected.request({ method: "eth_requestAccounts" });
        rememberWallet(injected, accounts);
        await ensureChain(injected, chainId);
        const web3 = new ethers.providers.Web3Provider(
          injected as ethers.providers.ExternalProvider,
        );
        const signer = web3.getSigner();
        const freshEnough = quote && quote.chainId === chainId && quote.expiry > Math.floor(Date.now() / 1000) + 30;
        const paidQuote = freshEnough ? quote : await loadQuote(chainId, token);
        const escrow = new ethers.Contract(paidQuote.escrow, SUBSCRIBE_ABI, signer);
        if (paidQuote.token !== ethers.constants.AddressZero) {
          const erc20 = new ethers.Contract(paidQuote.token, ERC20_ABI, signer);
          const approve = await erc20.approve(paidQuote.escrow, paidQuote.totalAmount);
          await approve.wait();
        }
        const tx = await escrow.subscribe(
          paidQuote.orderIdBytes32,
          paidQuote.serviceId,
          paidQuote.token,
          paidQuote.setupAmount,
          paidQuote.periodAmounts,
          paidQuote.totalAmount,
          paidQuote.expiry,
          paidQuote.signature,
          paidQuote.orderId,
          { value: paidQuote.token === ethers.constants.AddressZero ? paidQuote.totalAmount : 0 },
        );
        await tx.wait();
        await getCryptoStatus({
          orderId: paidQuote.orderId,
          chainId: paidQuote.chainId,
          lang: lang === "he" ? "he" : "en",
        }).catch(() => undefined);
        sessionStorage.setItem(
          "secnum_crypto_wait",
          JSON.stringify({
            orderId: paidQuote.orderId,
            chainId: paidQuote.chainId,
            escrow: paidQuote.escrow,
            txHash: tx.hash,
          }),
        );
        window.location.assign(waitPath(paidQuote.orderId, chainId, lang === "he" ? "he" : "en"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Crypto checkout failed";
        setError(message);
        setStatus("error");
      }
    },
    [lang, rememberWallet, quote, loadQuote],
  );

  return {
    status,
    error,
    initiate,
    reset,
    connect,
    connecting,
    loadQuote,
    quote,
    quoteLoading,
    account,
    accountShort: account ? shortenAddress(account) : null,
    walletName,
  };
}
