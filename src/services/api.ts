import { getApiConfig } from "../config/constants";
import type { CheckoutSessionResponse, ActivateResponse } from "../types";
import type { ActivationProof } from "../utils/semaphore";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function post<T>(url: string, body: Record<string, unknown>): Promise<T> {
  let res: Response;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 20000);
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("Failed to reach checkout server", 0);
  } finally {
    window.clearTimeout(timer);
  }

  const raw = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    if (!res.ok) {
      throw new ApiError(raw.slice(0, 180) || `Request failed (${res.status})`, res.status);
    }
    throw new ApiError("Invalid checkout response", res.status);
  }

  if (!res.ok) {
    const error = typeof data.error === "string" ? data.error : "Request failed";
    const message = typeof data.message === "string" ? data.message : null;
    const code = typeof data.code === "string" ? data.code : null;
    const detail = [code, message ? `${error}: ${message}` : error]
      .filter(Boolean)
      .join(" | ");
    throw new ApiError(detail || error, res.status);
  }

  return data as T;
}

export interface CreateCheckoutParams {
  packageId: string;
  packageName: string;
  transactionPrice: string;
  subscriptionPrice: string;
  currency: string;
  /** Bare URL — the GCP function appends &session_id=<uuid> */
  successUrl: string;
  /** Bare URL — the GCP function appends &session_id=<uuid> */
  failureUrl: string;
  /** Required by the GCP function — pass a generated UUID for anonymous users */
  userId: string;
  /**
   * Purchase UI language. Persisted on the order and threaded into emails,
   * activation links, and Arnacon claim URLs. Must be "en" | "he".
   */
  lang: "en" | "he";
  /** For port orders — the Firestore doc ID in portedNumbers collection */
  portDocId?: string;
  /**
   * Optional Stripe coupon id (FB campaign offer).
   * Requires payment-link-generator to accept `couponId` / `coupon_id`.
   */
  couponId?: string;
}

export function createCheckoutSession(
  params: CreateCheckoutParams,
): Promise<CheckoutSessionResponse> {
  const { STRIPE_URL } = getApiConfig();
  const body: Record<string, unknown> = {
    packageId: params.packageId,
    packageName: params.packageName,
    transactionPrice: params.transactionPrice,
    subscriptionPrice: params.subscriptionPrice,
    currency: params.currency,
    success_url: params.successUrl,
    failure_url: params.failureUrl,
    userId: params.userId,
    serviceProvider: "secnum",
    lang: params.lang === "he" ? "he" : "en",
  };
  if (params.portDocId) body.port_doc_id = params.portDocId;
  if (params.couponId) {
    body.couponId = params.couponId;
    body.coupon_id = params.couponId;
  }
  return post<CheckoutSessionResponse>(STRIPE_URL, body);
}

/**
 * Redeems a one-time activation token (from the confirmation email) and returns
 * the claimUrl deeplink. The secret never leaves the backend in readable form.
 */
export async function redeemActivationToken(
  token: string,
): Promise<{ claimUrl: string; label: string }> {
  const { ORDER_RESULT_URL } = getApiConfig();
  const url = `${ORDER_RESULT_URL.replace(/\/$/, "")}/redeem-token?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "Invalid activation token",
      res.status,
    );
  }
  return {
    claimUrl: data.claimUrl as string,
    label: (data.label as string) ?? "",
  };
}

export function activateNumber(
  userSecret: string,
  label: string,
  owner: string,
): Promise<ActivateResponse> {
  const { API_URL } = getApiConfig();
  return post<ActivateResponse>(API_URL, {
    action: "activate",
    userSecret,
    label,
    owner,
  });
}

export interface GroupMembersResponse {
  commitments: string[];
  scope: string;
  groupId?: string;
  merkleTreeRoot?: string;
  memberCount?: string;
}

/** Fetches all Semaphore group commitments and the REGISTER_SCOPE from the chain-activate function. */
export function getGroupMembers(): Promise<GroupMembersResponse> {
  const { API_URL } = getApiConfig();
  const url = `${API_URL.replace(/\/$/, "")}/group-members`;
  return fetch(url, { method: "GET", headers: { Accept: "application/json" } }).then(
    async (res) => {
      const data = await res.json();
      if (!res.ok) throw new ApiError(data.error || "Failed to fetch group members", res.status);
      return data as GroupMembersResponse;
    },
  );
}

/** Sends a pre-generated ZK proof to secnum-activate-number for validation and ANS linking. */
export function activateWithProof(
  proof: ActivationProof,
  label: string,
  web3identity: string,
): Promise<ActivateResponse> {
  const { ACTIVATE_URL } = getApiConfig();
  return post<ActivateResponse>(ACTIVATE_URL, { proof, label, web3identity });
}

export type RecoveryRequestResult = {
  ok: true;
  customer: boolean;
  recoverable: boolean;
  emailed?: boolean;
};

export type RecoveryCompleteResult = {
  ok: true;
  web3identity: string;
  labels: string[];
  installed: string[];
  failedInstalls: string[];
};

export function requestRecovery(
  email: string,
  lang: "en" | "he",
): Promise<RecoveryRequestResult> {
  const { RECOVERY_URL } = getApiConfig();
  return post<RecoveryRequestResult>(RECOVERY_URL, {
    action: "request",
    email,
    lang,
  });
}

export function completeRecovery(
  token: string,
  web3identity: string,
): Promise<RecoveryCompleteResult> {
  const { RECOVERY_URL } = getApiConfig();
  return post<RecoveryCompleteResult>(RECOVERY_URL, {
    action: "complete",
    token,
    web3identity,
  });
}

export interface CryptoQuote {
  orderId: string;
  orderIdBytes32: string;
  chainId: number;
  escrow: string;
  token: string;
  tokenSymbol: string;
  setupAmount: string;
  periodAmounts: string[];
  totalAmount: string;
  expiry: number;
  serviceId: number;
  signature: string;
  quoteSigner: string;
}

export interface CryptoEscrowState {
  token: string;
  start: number;
  cancelEffective: number;
  periodSeconds: number;
  termPeriods: number;
  setupAmount: string;
  setupWithdrawn: string;
  periodsWithdrawn: number;
  periodAmounts: string[];
  now: number;
}

export interface CryptoOrderStatus {
  orderId: string;
  status: string;
  paid: boolean;
  provisioned: boolean;
  chainId: number;
  escrow: string;
  tokenSymbol?: string;
  expiry?: number;
  label?: string | null;
  claimed?: boolean;
  escrowState?: CryptoEscrowState | null;
}

export function createCryptoQuote(params: {
  chainId: number;
  token: "native" | "usdc";
}): Promise<CryptoQuote> {
  const { CRYPTO_URL } = getApiConfig();
  return post<CryptoQuote>(`${CRYPTO_URL.replace(/\/$/, "")}/quote`, params);
}

export function getCryptoStatus(params: {
  orderId: string;
  chainId: number;
  lang?: "en" | "he";
}): Promise<CryptoOrderStatus> {
  const { CRYPTO_URL } = getApiConfig();
  return post<CryptoOrderStatus>(`${CRYPTO_URL.replace(/\/$/, "")}/status`, params);
}

export function listCryptoOrders(payer: string): Promise<{ orders: CryptoOrderStatus[] }> {
  const { CRYPTO_URL } = getApiConfig();
  return post<{ orders: CryptoOrderStatus[] }>(`${CRYPTO_URL.replace(/\/$/, "")}/orders`, { payer });
}

export function claimCryptoActivation(params: {
  orderId: string;
  signature: string;
  issuedAt: number;
}): Promise<{ token: string }> {
  const { CRYPTO_URL } = getApiConfig();
  return post<{ token: string }>(`${CRYPTO_URL.replace(/\/$/, "")}/claim`, params);
}

export function relayCryptoCancel(params: {
  orderId: string;
  chainId: number;
  deadline: number;
  signature: string;
}): Promise<{ txHash: string; cancelEffective: number }> {
  const { CRYPTO_URL } = getApiConfig();
  return post<{ txHash: string; cancelEffective: number }>(
    `${CRYPTO_URL.replace(/\/$/, "")}/cancel`,
    params,
  );
}
