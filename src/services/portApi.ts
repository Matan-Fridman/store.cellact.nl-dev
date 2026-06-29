/**
 * Number-porting session API.
 *
 * All URLs are resolved through getApiConfig() in constants.ts, so they
 * automatically follow the testnet/mainnet selection (no ?dev=true → mainnet,
 * ?dev=true → staging). No URL env vars live here.
 */

import { getApiConfig } from "../config/constants";

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const IS_MOCK = !!import.meta.env.VITE_PORT_MOCK;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortSession {
  sessionId: string;
}

// ─── Deeplink builder ─────────────────────────────────────────────────────────

/**
 * Builds the arnacon:// deeplink encoded in the QR code.
 * The confirm endpoint is taken from the active API config (testnet or mainnet)
 * so the Arnacon app always calls back to the right environment.
 */
export function buildPortQrPayload(session: PortSession): string {
  const { QR_CONFIRM_URL } = getApiConfig();
  return (
    `arnacon://auth` +
    `?session=${encodeURIComponent(session.sessionId)}` +
    `&provider=Secnum` +
    `&endpoint=${encodeURIComponent(QR_CONFIRM_URL)}`
  );
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Ask the server for a new login session. Returns { sessionId }. */
export async function createPortSession(): Promise<PortSession> {
  if (IS_MOCK) {
    await delay(700);
    return { sessionId: `sess_${Math.random().toString(36).slice(2, 14)}` };
  }

  const { QR_CREATE_SESSION_URL } = getApiConfig();
  const res = await fetch(QR_CREATE_SESSION_URL, { method: "POST" });
  if (!res.ok) throw new Error(`Session create failed: ${res.status}`);
  const data = await res.json();
  return { sessionId: data.sessionId };
}

/** Submit the porting request once the wallet is authenticated. */
export async function submitPortRequest(
  sessionId: string,
  walletAddress: string,
  phoneNumber: string,
  email: string,
): Promise<void> {
  if (IS_MOCK) {
    await delay(900);
    console.info("[port mock] submit", { sessionId, walletAddress, phoneNumber, email });
    return;
  }

  const { PORT_REQUEST_URL } = getApiConfig();
  const res = await fetch(PORT_REQUEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number: phoneNumber, walletAddress, email }),
  });
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
}

// ─── Phone normalisation ──────────────────────────────────────────────────────

/** Normalise any Israeli phone number input to the 972XXXXXXXXX format. */
export function normalizeIsraeliNumber(raw: string): string | null {
  const stripped = raw.replace(/[\s\-().+]/g, "");
  let digits = stripped;

  if (digits.startsWith("972")) {
    // already in 972... form
  } else if (digits.startsWith("05") || digits.startsWith("07")) {
    digits = "972" + digits.slice(1);
  } else if (digits.startsWith("5") || digits.startsWith("7")) {
    digits = "972" + digits;
  } else {
    return null;
  }

  if (!/^972\d{9}$/.test(digits)) return null;
  return digits;
}
