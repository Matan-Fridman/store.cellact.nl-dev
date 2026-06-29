import { getApiConfig } from "../config/constants";
import type { CheckoutSessionResponse, ActivateResponse, OrderResultResponse } from "../types";
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
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const error = typeof data.error === "string" ? data.error : "Request failed";
    const message = typeof data.message === "string" ? data.message : null;
    throw new ApiError(message ? `${error}: ${message}` : error, res.status);
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
  /** For port orders — the Firestore doc ID in portedNumbers collection */
  portDocId?: string;
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
  };
  if (params.portDocId) body.port_doc_id = params.portDocId;
  return post<CheckoutSessionResponse>(STRIPE_URL, body);
}

/** Fetches claimUrl (or secret/label) from the webhook after payment. Success page polls this. */
export function getOrderResult(sessionId: string): Promise<OrderResultResponse> {
  const { ORDER_RESULT_URL } = getApiConfig();
  const url = `${ORDER_RESULT_URL.replace(/\/$/, "")}/order-result?session_id=${encodeURIComponent(sessionId)}`;
  return fetch(url, { method: "GET", headers: { Accept: "application/json" } }).then(
    async (res) => {
      const text = await res.text();
      let data: Record<string, unknown>;
      try {
        data = (text.trim() ? JSON.parse(text) : {}) as Record<string, unknown>;
      } catch {
        throw new ApiError(
          `Order result was not JSON (${res.status}). ${text.slice(0, 60)}`,
          res.status,
        );
      }
      if (!res.ok) {
        throw new ApiError(
          typeof data.error === "string" ? data.error : "Request failed",
          res.status,
        );
      }
      return {
        claimUrl: typeof data.claimUrl === "string" ? data.claimUrl : null,
        label: typeof data.label === "string" ? data.label : null,
        userSecret: typeof data.userSecret === "string" ? data.userSecret : null,
      };
    },
  );
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

/** Sends a pre-generated ZK proof to the server for transaction submission. */
export function activateWithProof(
  proof: ActivationProof,
  label: string,
  owner: string,
): Promise<ActivateResponse> {
  const { API_URL } = getApiConfig();
  return post<ActivateResponse>(API_URL, {
    action: "activateWithProof",
    proof,
    label,
    owner,
  });
}
