export interface CheckoutSessionResponse {
  /** Stripe-hosted checkout URL to redirect the user to */
  url: string;
}

export interface OrderResultResponse {
  /** Set by webhook after provision; null while still processing */
  claimUrl: string | null;
}

export interface PurchaseResponse {
  claimUrl: string;
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
