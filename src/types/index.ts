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
