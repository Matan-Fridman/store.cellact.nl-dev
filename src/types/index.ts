export interface CheckoutSessionResponse {
  /** Stripe-hosted checkout URL to redirect the user to */
  url: string;
}

export interface OrderResultResponse {
  /** Built by webhook from stored label + userSecret; null while still processing */
  claimUrl: string | null;
  /** Stored in Firestore for server-side flows (e.g. subscription cancel) */
  label: string | null;
  userSecret: string | null;
}

export interface PurchaseResponse {
  claimUrl: string;
  label?: string;
  userSecret?: string;
}

export interface ActivateResponse {
  label: string;
  name: string;
  owner: string;
}

export interface ClaimParams {
  secret: string;
  label: string;
  walletAddress: string;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";
