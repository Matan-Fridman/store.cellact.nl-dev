/**
 * Number-porting session API.
 *
 * Staging endpoints (default):
 *   qr-login-create-session  →  POST, returns { sessionId, endpointUrl }
 *   qr-login-confirm         →  POST { sessionId }, returns { walletAddress } | { walletAddress: null }
 *
 * Override the base URL via:
 *   VITE_PORT_API_BASE_URL   (defaults to arnacon-staging-production)
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE =
  import.meta.env.VITE_PORT_API_BASE_URL ??
  "https://europe-west1-arnacon-staging-production.cloudfunctions.net";

const CREATE_SESSION_URL = `${BASE}/qr-login-create-session`;

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const IS_MOCK = !!import.meta.env.VITE_PORT_MOCK;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortSession {
  sessionId: string;
  /** Returned by the server — embedded in the deeplink so Arnacon knows where to connect. */
  confirmEndpoint: string;
}


// ─── Deeplink builder ─────────────────────────────────────────────────────────

/**
 * Builds the arnacon:// deeplink encoded as a QR code.
 * Both sessionId and endpointUrl come from the server's create-session response.
 */
export function buildPortQrPayload(session: PortSession): string {
  return (
    `arnacon://auth` +
    `?session=${encodeURIComponent(session.sessionId)}` +
    `&provider=Secnum` +
    `&endpoint=${encodeURIComponent(session.confirmEndpoint)}`
  );
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Ask the server for a new login session. Returns { sessionId, endpointUrl }. */
export async function createPortSession(): Promise<PortSession> {
  if (IS_MOCK) {
    await delay(700);
    return {
      sessionId:       `sess_${Math.random().toString(36).slice(2, 14)}`,
      confirmEndpoint: "https://mock-port-ws.example.com",
    };
  }

  const res = await fetch(CREATE_SESSION_URL, { method: "POST" });
  if (!res.ok) throw new Error(`Session create failed: ${res.status}`);
  return res.json(); // { sessionId: string, endpointUrl: string }
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

  const res = await fetch(`${BASE}/port-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, walletAddress, phoneNumber, email }),
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
