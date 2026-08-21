import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { createCryptoQuote, getCryptoStatus, relayCryptoCancel, type CryptoQuote } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import type { AsyncStatus } from "../types";

const SUBSCRIBE_ABI = [
  "function subscribe(bytes32 orderId, uint256 serviceId, address token, uint256 setupAmount, uint256[] periodAmounts, uint256 totalAmount, uint256 expiry, bytes signature, string orderRef) payable",
];
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isPayMyEmail?: boolean;
  isMetaMask?: boolean;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    paymyemail?: EthereumProvider;
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
    rpcUrls: ["https://polygon-amoy-bor-rpc.publicnode.com", "https://rpc-amoy.polygon.technology"],
    blockExplorerUrls: ["https://amoy.polygonscan.com"],
  },
  11155111: {
    chainId: "0xaa36a7",
    chainName: "Sepolia",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org", "https://ethereum-sepolia-rpc.publicnode.com"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
};

export type WalletKind = "metamask" | "paymyemail";

type AnnouncedWallet = {
  info?: { rdns?: string; name?: string };
  provider: EthereumProvider;
};

export type DiscoveredWallet = {
  kind: WalletKind;
  name: string;
  available: boolean;
  provider?: EthereumProvider;
};

const WALLET_KEY = "secnum_crypto_wallet";

export function storedWalletKind(): WalletKind | null {
  const value = sessionStorage.getItem(WALLET_KEY);
  return value === "metamask" || value === "paymyemail" ? value : null;
}

export function storeWalletKind(kind: WalletKind): void {
  sessionStorage.setItem(WALLET_KEY, kind);
}

export function clearWalletKind(): void {
  sessionStorage.removeItem(WALLET_KEY);
}

function kindOf(item: AnnouncedWallet): WalletKind | null {
  const rdns = item.info?.rdns || "";
  if (rdns === "email.paymyemail.wallet" || item.provider.isPayMyEmail) return "paymyemail";
  if (rdns === "io.metamask" || item.provider.isMetaMask) return "metamask";
  return null;
}

async function collectAnnounced(): Promise<AnnouncedWallet[]> {
  const announced: AnnouncedWallet[] = [];
  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent).detail as AnnouncedWallet;
    if (detail?.provider) announced.push(detail);
  };
  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  window.removeEventListener("eip6963:announceProvider", onAnnounce);
  return announced;
}

export async function discoverWallets(): Promise<DiscoveredWallet[]> {
  const announced = await collectAnnounced();
  const byKind = new Map<WalletKind, EthereumProvider>();
  for (const item of announced) {
    const kind = kindOf(item);
    if (kind && !byKind.has(kind)) byKind.set(kind, item.provider);
  }
  if (window.paymyemail && !byKind.has("paymyemail")) {
    byKind.set("paymyemail", window.paymyemail);
  }
  const fallback = window.ethereum;
  if (fallback) {
    if (fallback.isPayMyEmail && !byKind.has("paymyemail")) byKind.set("paymyemail", fallback);
    else if (fallback.isMetaMask && !byKind.has("metamask")) byKind.set("metamask", fallback);
  }
  return [
    {
      kind: "metamask",
      name: "MetaMask",
      available: byKind.has("metamask"),
      provider: byKind.get("metamask"),
    },
    {
      kind: "paymyemail",
      name: "PayMyEmail",
      available: byKind.has("paymyemail"),
      provider: byKind.get("paymyemail"),
    },
  ];
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function accountsOf(provider: EthereumProvider): Promise<string[]> {
  try {
    const accounts = await withTimeout(
      provider.request({ method: "eth_accounts" }),
      800,
      "wallet_timeout",
    );
    if (!Array.isArray(accounts)) return [];
    return accounts.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export async function pickEthereum(
  preferAddress?: string,
  preferKind?: WalletKind,
): Promise<EthereumProvider> {
  const wallets = await discoverWallets();
  const kind = preferKind || storedWalletKind();
  const want = preferAddress?.toLowerCase();
  if (kind) {
    const chosen = wallets.find((item) => item.kind === kind)?.provider;
    if (chosen) {
      if (!want) return chosen;
      const accounts = await accountsOf(chosen);
      if (
        accounts.length === 0 ||
        accounts.some((account) => account.toLowerCase() === want)
      ) {
        return chosen;
      }
    } else if (preferKind) {
      throw new Error("wallet_missing");
    }
  }
  if (want) {
    const live = await Promise.all(
      wallets
        .filter((item) => item.provider)
        .map(async (item) => ({ item, accounts: await accountsOf(item.provider as EthereumProvider) })),
    );
    const match = live.find((entry) =>
      entry.accounts.some((account) => account.toLowerCase() === want),
    );
    if (match?.item.provider) return match.item.provider;
  }
  throw new Error("wallet_required");
}

function providerErrorCode(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "number" ? code : undefined;
}

function errorText(err: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = err;
  for (let i = 0; i < 6 && current; i += 1) {
    if (seen.has(current)) break;
    seen.add(current);
    if (typeof current === "string") {
      parts.push(current);
      break;
    }
    if (typeof current !== "object") break;
    const obj = current as {
      message?: unknown;
      reason?: unknown;
      code?: unknown;
      error?: unknown;
      data?: unknown;
    };
    if (typeof obj.message === "string") parts.push(obj.message);
    if (typeof obj.reason === "string") parts.push(obj.reason);
    if (obj.code !== undefined) parts.push(String(obj.code));
    if (typeof obj.data === "string") parts.push(obj.data);
    current =
      obj.error ||
      (obj.data && typeof obj.data === "object" ? obj.data : undefined);
  }
  return parts.join(" ");
}

function hasNumericCode(err: unknown, want: number): boolean {
  const seen = new Set<unknown>();
  let current: unknown = err;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const obj = current as { code?: unknown; error?: unknown; data?: unknown };
    if (obj.code === want || obj.code === String(want)) return true;
    current = obj.error || (obj.data && typeof obj.data === "object" ? obj.data : undefined);
  }
  return false;
}

export function classifyCryptoError(err: unknown): string {
  const known = err instanceof Error ? err.message : "";
  if (
    known === "expired_quote" ||
    known === "rpc_busy" ||
    known === "user_rejected" ||
    known === "insufficient_funds" ||
    known === "tx_failed" ||
    known === "already_paid" ||
    known === "already_cancelled" ||
    known === "nothing_to_withdraw" ||
    known === "not_payer" ||
    known === "wallet_required" ||
    known === "wallet_missing"
  ) {
    return known;
  }
  const revert = revertCode(err);
  if (revert) return revert;
  const text = errorText(err);
  if (/not connected|call eth_requestaccounts|paymyemail is locked|origin not allowed/i.test(text)) {
    return "wallet_required";
  }
  if (
    hasNumericCode(err, 4001) ||
    /user denied|user rejected|rejected the request|denied transaction signature|action_rejected/i.test(
      text,
    )
  ) {
    return "user_rejected";
  }
  if (/insufficient funds|insufficient balance|exceeds the balance|gas required exceeds/i.test(text)) {
    return "insufficient_funds";
  }
  if (/unknown account #0|unsupported_operation/i.test(text) && /getAddress/i.test(text)) {
    return "wallet_required";
  }
  if (/tx_not_broadcast|never saw this transaction|not accepted by the network/i.test(text)) {
    return "tx_not_broadcast";
  }
  if (isRpcBusy(err) || /429|too many requests/i.test(text)) return "rpc_busy";
  return "tx_failed";
}

export function logCryptoError(action: string, err: unknown): string {
  const code = classifyCryptoError(err);
  console.error("[crypto]", action, code, err);
  return code;
}

export function cryptoErrorCopy(
  copy: {
    expiredQuote: string;
    rpcBusy: string;
    userRejected: string;
    insufficientFunds: string;
    txFailed: string;
    alreadyCancelled?: string;
    nothingToWithdraw?: string;
    notPayer?: string;
    walletRequired?: string;
    walletMissing?: string;
    txNotBroadcast?: string;
  },
  err: unknown,
): string {
  const code = typeof err === "string" ? err : classifyCryptoError(err);
  if (code === "expired_quote") return copy.expiredQuote;
  if (code === "rpc_busy") return copy.rpcBusy;
  if (code === "user_rejected") return copy.userRejected;
  if (code === "insufficient_funds") return copy.insufficientFunds;
  if (code === "tx_not_broadcast" && copy.txNotBroadcast) return copy.txNotBroadcast;
  if (code === "wallet_required" && copy.walletRequired) return copy.walletRequired;
  if (code === "wallet_missing" && copy.walletMissing) return copy.walletMissing;
  if (code === "already_cancelled" && copy.alreadyCancelled) return copy.alreadyCancelled;
  if (code === "nothing_to_withdraw" && copy.nothingToWithdraw) return copy.nothingToWithdraw;
  if (code === "not_payer" && copy.notPayer) return copy.notPayer;
  if (code === "tx_failed" || !code || code.length > 80 || /\{|json-rpc|internal json/i.test(code)) {
    return copy.txFailed;
  }
  return code;
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
  80002: "0x11b90D89F623dB07977e0710b97DB46Ef373aEe0",
  11155111: "0x11b90D89F623dB07977e0710b97DB46Ef373aEe0",
};

export function escrowExplorerUrl(chainId: CryptoChainId, address = CRYPTO_ESCROW[chainId]): string {
  const base = CRYPTO_CHAINS[chainId].blockExplorerUrls[0]?.replace(/\/$/, "") ?? "";
  return `${base}/address/${address}`;
}

export function escrowTxUrl(chainId: CryptoChainId, txHash: string): string {
  const base = CRYPTO_CHAINS[chainId].blockExplorerUrls[0]?.replace(/\/$/, "") ?? "";
  return `${base}/tx/${txHash}`;
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
  paidTotal: bigint;
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
    paidTotal: setupAmount + sumPeriods(periods, 0n, BigInt(periods.length)),
  };
}

export async function readEscrowSettlement(
  chainId: CryptoChainId,
  escrow: string,
  idBytes32: string,
  runner?: ethers.providers.Provider,
): Promise<EscrowSettlement | null> {
  const provider = runner ?? jsonRpc(chainId);
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
  [ethers.utils.id("OrderUsed()").slice(0, 10)]: "already_paid",
  [ethers.utils.id("ExpiredQuote()").slice(0, 10)]: "expired_quote",
};

function revertCode(err: unknown): string | null {
  const blob = errorText(err);
  for (const match of blob.matchAll(/0x([0-9a-f]{8})\b/gi)) {
    const mapped = ESCROW_REVERT[`0x${match[1].toLowerCase()}`];
    if (mapped) return mapped;
  }
  return null;
}

function isRpcBusy(err: unknown): boolean {
  return /rate limited|timeout|missing revert data|could not detect network|429|too many requests/i.test(
    errorText(err),
  );
}

function persistWait(params: {
  orderId: string;
  chainId: CryptoChainId;
  escrow: string;
  txHash?: string;
}): void {
  sessionStorage.setItem("secnum_crypto_wait", JSON.stringify(params));
}

function jsonRpc(chainId: CryptoChainId, index = 0): ethers.providers.JsonRpcProvider {
  const urls = CRYPTO_CHAINS[chainId].rpcUrls;
  return new ethers.providers.JsonRpcProvider(urls[Math.min(index, urls.length - 1)]);
}

async function waitOnPublicRpc(chainId: CryptoChainId, hash: string): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < CRYPTO_CHAINS[chainId].rpcUrls.length; i += 1) {
    try {
      await jsonRpc(chainId, i).waitForTransaction(hash, 1, 60000);
      return;
    } catch (err) {
      lastErr = err;
      if (!isRpcBusy(err) && classifyCryptoError(err) !== "rpc_busy") throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("rpc_busy");
}

const GAS_FLOOR = ethers.utils.parseEther("0.0005");

async function assertCanPay(params: {
  chainId: CryptoChainId;
  payer: string;
  token: string;
  totalAmount: string;
}): Promise<void> {
  const provider = jsonRpc(params.chainId);
  const eth = await provider.getBalance(params.payer);
  if (params.token === ethers.constants.AddressZero) {
    const need = ethers.BigNumber.from(params.totalAmount).add(GAS_FLOOR);
    if (eth.lt(need)) throw new Error("insufficient_funds");
    return;
  }
  if (eth.lt(GAS_FLOOR)) throw new Error("insufficient_funds");
  const erc20 = new ethers.Contract(params.token, ERC20_ABI, provider);
  const tokenBal = (await erc20.balanceOf(params.payer)) as ethers.BigNumber;
  if (tokenBal.lt(params.totalAmount)) throw new Error("insufficient_funds");
}

async function isOrderUsed(
  chainId: CryptoChainId,
  escrow: string,
  orderIdBytes32: string,
): Promise<boolean> {
  const provider = jsonRpc(chainId);
  const contract = new ethers.Contract(escrow, ["function orderUsed(bytes32) view returns (bool)"], provider);
  return Boolean(await contract.orderUsed(orderIdBytes32));
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

function firstAccount(value: unknown): string | null {
  if (!Array.isArray(value) || typeof value[0] !== "string" || value[0].length === 0) {
    return null;
  }
  return value[0];
}

export async function signerFromInjected(
  injected: EthereumProvider,
  preferAddress?: string,
): Promise<{ signer: ethers.providers.JsonRpcSigner; address: string }> {
  const requested = await injected.request({ method: "eth_requestAccounts" });
  const listed = await injected.request({ method: "eth_accounts" }).catch(() => []);
  const raw = firstAccount(requested) || firstAccount(listed) || preferAddress || null;
  if (!raw) throw new Error("wallet_required");
  const address = ethers.utils.getAddress(raw);
  const web3 = new ethers.providers.Web3Provider(
    injected as ethers.providers.ExternalProvider,
    "any",
  );
  return { signer: web3.getSigner(address), address };
}

export async function sendEscrowPayerTx(
  chainId: CryptoChainId,
  escrow: string,
  idBytes32: string,
  method: "cancel" | "withdrawUnused",
  payer?: string,
): Promise<string> {
  const injected = await pickEthereum(payer);
  await ensureChain(injected, chainId);
  const { signer } = await signerFromInjected(injected, payer);
  const contract = new ethers.Contract(escrow, ESCROW_ACCOUNT_ABI, signer);
  try {
    const tx = (await contract[method](idBytes32)) as { hash: string };
    await waitOnPublicRpc(chainId, tx.hash);
    return tx.hash;
  } catch (err) {
    throw new Error(logCryptoError("escrow-tx", err));
  }
}

const CANCEL_TYPES = {
  Cancel: [
    { name: "orderId", type: "bytes32" },
    { name: "deadline", type: "uint256" },
  ],
};

export async function signAndRelayCancel(
  chainId: CryptoChainId,
  escrow: string,
  orderId: string,
  idBytes32: string,
  payer?: string,
): Promise<{ txHash: string | null; cancelEffective?: number }> {
  const canRelay = escrow.toLowerCase() === CRYPTO_ESCROW[chainId].toLowerCase();
  if (!canRelay) {
    const txHash = await sendEscrowPayerTx(chainId, escrow, idBytes32, "cancel", payer);
    return { txHash };
  }
  const injected = await pickEthereum(payer);
  await ensureChain(injected, chainId);
  const { signer } = await signerFromInjected(injected, payer);
  const deadline = Math.floor(Date.now() / 1000) + 600;
  let signature: string;
  try {
    signature = await signer._signTypedData(
      { name: "SubscriptionEscrow", version: "1", chainId, verifyingContract: escrow },
      CANCEL_TYPES,
      { orderId: idBytes32, deadline },
    );
  } catch (err) {
    throw new Error(logCryptoError("cancel-sign", err));
  }
  try {
    const result = await relayCryptoCancel({ orderId, chainId, deadline, signature });
    return { txHash: result.txHash || null, cancelEffective: result.cancelEffective };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/not_payer/i.test(message)) {
      const mapped = new Error("not_payer");
      mapped.name = "EscrowTxError";
      throw mapped;
    }
    const settlement = await readEscrowSettlement(chainId, escrow, idBytes32).catch(() => null);
    if (settlement?.cancelAlreadySet || /already_cancelled/i.test(message)) {
      return {
        txHash: null,
        cancelEffective: settlement?.cancelEffectiveAt || undefined,
      };
    }
    throw err;
  }
}

export async function listOnchainOrderIds(
  chainId: CryptoChainId,
  escrow: string,
  payer: string,
): Promise<string[]> {
  const provider = jsonRpc(chainId);
  const contract = new ethers.Contract(escrow, ESCROW_ACCOUNT_ABI, provider);
  const ids = (await contract.ordersOf(payer)) as string[];
  return ids.map((id) => String(id));
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function describeWallet(injected: EthereumProvider): string {
  if (injected.isPayMyEmail) return "PayMyEmail";
  if (injected.isMetaMask) return "MetaMask";
  return storedWalletKind() === "paymyemail" ? "PayMyEmail" : "Wallet";
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

  const rememberWallet = useCallback((injected: EthereumProvider, accounts: unknown, kind?: WalletKind) => {
    if (kind) storeWalletKind(kind);
    setAccount(firstAccount(accounts));
    setWalletName(describeWallet(injected));
  }, []);

  useEffect(() => {
    const kind = storedWalletKind();
    if (!kind) return;
    let cancelled = false;
    let injected: EthereumProvider | undefined;
    const onAccountsChanged = (...args: unknown[]) => {
      setAccount(firstAccount(args[0]));
    };

    void (async () => {
      try {
        const provider = await pickEthereum(undefined, kind);
        if (cancelled) return;
        injected = provider;
        injected.on?.("accountsChanged", onAccountsChanged);
        const accounts = await injected.request({ method: "eth_accounts" });
        if (!cancelled) rememberWallet(injected, accounts, kind);
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

  const loadQuote = useCallback(async (
    chainId: CryptoChainId,
    token: CryptoAsset,
    buyer: { name: string; email: string },
  ) => {
    setQuoteLoading(true);
    setError(null);
    try {
      const next = await createCryptoQuote({
        chainId,
        token,
        buyerName: buyer.name,
        buyerEmail: buyer.email,
        lang: lang === "he" ? "he" : "en",
      });
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
  }, [lang]);

  const connect = useCallback(async (kind: WalletKind) => {
    setConnecting(true);
    setError(null);
    try {
      storeWalletKind(kind);
      const injected = await pickEthereum(undefined, kind);
      injected.on?.("accountsChanged", (...args: unknown[]) => {
        setAccount(firstAccount(args[0]));
      });
      const accounts = await injected.request({ method: "eth_requestAccounts" });
      rememberWallet(injected, accounts, kind);
      return true;
    } catch (err) {
      setError(logCryptoError("connect", err));
      setStatus("error");
      return false;
    } finally {
      setConnecting(false);
    }
  }, [rememberWallet]);

  const disconnect = useCallback(() => {
    clearWalletKind();
    setAccount(null);
    setWalletName(null);
    setError(null);
  }, []);

  const initiate = useCallback(
    async (chainId: CryptoChainId, token: CryptoAsset, buyer: { name: string; email: string }) => {
      setStatus("loading");
      setError(null);
      try {
        const injected = await pickEthereum();
        await injected.request({ method: "eth_requestAccounts" });
        await ensureChain(injected, chainId);
        const { signer, address } = await signerFromInjected(injected);
        rememberWallet(injected, [address], storedWalletKind() || undefined);
        const freshEnough =
          quote &&
          quote.chainId === chainId &&
          quote.expiry > Math.floor(Date.now() / 1000) + 30;
        const paidQuote = freshEnough ? quote : await loadQuote(chainId, token, buyer);
        try {
          await assertCanPay({
            chainId,
            payer: address,
            token: paidQuote.token,
            totalAmount: paidQuote.totalAmount,
          });
        } catch (err) {
          if (classifyCryptoError(err) === "insufficient_funds") {
            throw new Error("insufficient_funds");
          }
        }
        const uiLang = lang === "he" ? "he" : "en";
        const finish = async (txHash?: string) => {
          persistWait({
            orderId: paidQuote.orderId,
            chainId: paidQuote.chainId as CryptoChainId,
            escrow: paidQuote.escrow,
            txHash,
          });
          await getCryptoStatus({
            orderId: paidQuote.orderId,
            chainId: paidQuote.chainId,
            lang: uiLang,
          }).catch(() => undefined);
          window.location.assign(waitPath(paidQuote.orderId, chainId, uiLang));
        };

        const escrow = new ethers.Contract(paidQuote.escrow, SUBSCRIBE_ABI, signer);
        if (paidQuote.token !== ethers.constants.AddressZero) {
          const erc20 = new ethers.Contract(paidQuote.token, ERC20_ABI, signer);
          const approve = await erc20.approve(paidQuote.escrow, paidQuote.totalAmount, {
            from: address,
          });
          try {
            await waitOnPublicRpc(chainId, approve.hash);
          } catch {
            // Approve may already be mined; subscribe will fail loudly if not.
          }
        }
        let tx: { hash: string };
        try {
          tx = (await escrow.subscribe(
            paidQuote.orderIdBytes32,
            paidQuote.serviceId,
            paidQuote.token,
            paidQuote.setupAmount,
            paidQuote.periodAmounts,
            paidQuote.totalAmount,
            paidQuote.expiry,
            paidQuote.signature,
            paidQuote.orderId,
            {
              from: address,
              value: paidQuote.token === ethers.constants.AddressZero ? paidQuote.totalAmount : 0,
            },
          )) as { hash: string };
        } catch (err) {
          if (revertCode(err) === "already_paid") {
            await finish();
            return;
          }
          if (revertCode(err) === "expired_quote") {
            throw new Error("expired_quote");
          }
          const used = await isOrderUsed(chainId, paidQuote.escrow, paidQuote.orderIdBytes32).catch(
            () => false,
          );
          if (used) {
            await finish();
            return;
          }
          throw err;
        }
        await finish(tx.hash);
      } catch (err) {
        setError(logCryptoError("pay", err));
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
    disconnect,
    connecting,
    loadQuote,
    quote,
    quoteLoading,
    account,
    accountShort: account ? shortenAddress(account) : null,
    walletName,
  };
}
