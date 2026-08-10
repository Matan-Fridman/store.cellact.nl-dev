const WEB3_IDENTITY_SUFFIX = ".arnacon.global";
const ENS_LABEL_RE = /^(?:[a-z0-9]|[a-z0-9][a-z0-9-]{0,61}[a-z0-9])$/;

/** Returns canonical full identity, e.g. `{uid}.arnacon.global`. */
export function canonicalWeb3Identity(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (value.endsWith(WEB3_IDENTITY_SUFFIX)) {
    const uid = value.slice(0, -WEB3_IDENTITY_SUFFIX.length);
    return ENS_LABEL_RE.test(uid) ? value : null;
  }
  if (ENS_LABEL_RE.test(value)) {
    return `${value}${WEB3_IDENTITY_SUFFIX}`;
  }
  return null;
}

export function formatPhone(num: string): string {
  if (num.length >= 10) {
    return (
      "+" +
      num.slice(0, 3) +
      " " +
      num.slice(3, 5) +
      " " +
      num.slice(5, 8) +
      " " +
      num.slice(8)
    );
  }
  return num;
}

/** Display as Israeli local: 0557148414 (not +972…). */
export function formatIsraeliLocal(num: string): string {
  const digits = num.replace(/\D/g, "");
  if (digits.startsWith("972") && digits.length >= 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("0")) return digits;
  if (digits.length === 9) return `0${digits}`;
  return num;
}

export function buildQrUrl(data: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

/** Same deep link as blockchain CF / webhook `build_claim_url` — Arnacon install → /claim */
export function buildArnaconClaimUrl(
  userSecret: string,
  label: string,
  storeOrigin: string,
  prod?: boolean,
): string {
  const base = storeOrigin.replace(/\/$/, "");
  const devParam = prod !== undefined ? `&dev=${prod ? "false" : "true"}` : "";
  const claimPage = `${base}/claim?secret=${encodeURIComponent(userSecret)}&label=${encodeURIComponent(label)}${devParam}`;
  return `arnacon://install?url=${encodeURIComponent(claimPage)}&provider=Secnum`;
}

/**
 * Ensures the `dev` param inside an arnacon:// deep link matches the current
 * environment. Used when the server returns a pre-built claimUrl that may not
 * carry the correct dev flag for this client session.
 *
 * arnacon://install?url=<encoded /claim page>&provider=Secnum
 */
export function ensureClaimUrlDevParam(claimUrl: string, prod: boolean): string {
  try {
    // Extract the encoded inner URL from the arnacon:// deep link
    const qIndex = claimUrl.indexOf("?");
    if (qIndex === -1) return claimUrl;

    const rawParams = claimUrl.slice(qIndex + 1);
    const params = new URLSearchParams(rawParams);
    const encodedInner = params.get("url");
    if (!encodedInner) return claimUrl;

    // Parse the inner claim-page URL and set/overwrite the dev param
    const inner = new URL(decodeURIComponent(encodedInner));
    inner.searchParams.set("dev", prod ? "false" : "true");

    // Reconstruct the arnacon:// URL with the patched inner URL
    params.set("url", inner.toString());
    return claimUrl.slice(0, qIndex + 1) + params.toString();
  } catch {
    return claimUrl;
  }
}
