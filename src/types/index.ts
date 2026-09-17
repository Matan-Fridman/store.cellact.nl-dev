export interface CheckoutSessionResponse {
  /** Stripe-hosted checkout URL to redirect the user to */
  url: string;
}

export interface OrderResultResponse {
  /** For secnum orders: built from label + userSecret. Null while still processing. */
  claimUrl: string | null;
  /** Stored in Firestore for server-side flows (e.g. subscription cancel) */
  label: string | null;
  userSecret: string | null;
  /** For port orders: the phone number that was ported (e.g. "+972501234567") */
  portedNumber?: string | null;
}

export interface PurchaseResponse {
  /** Set for normal secnum orders — used to build the claim QR. */
  claimUrl?: string;
  label?: string;
  userSecret?: string;
  /** Set for port orders — ENS was registered server-side, no QR needed. */
  portedNumber?: string;
}

export interface ActivateResponse {
  label: string;
  name?: string;
  web3identity: string;
}

export interface ClaimParams {
  secret: string;
  label: string;
  web3identity: string;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";
