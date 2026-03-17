import { API_URL } from "../config/constants";
import type { PurchaseResponse, ActivateResponse } from "../types";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function post<T>(body: Record<string, string>): Promise<T> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || "Request failed", res.status);
  }

  return data as T;
}

export function purchaseNumber(label: string): Promise<PurchaseResponse> {
  return post<PurchaseResponse>({ action: "purchase", label });
}

export function activateNumber(
  userSecret: string,
  label: string,
  owner: string,
): Promise<ActivateResponse> {
  return post<ActivateResponse>({
    action: "activate",
    userSecret,
    label,
    owner,
  });
}
