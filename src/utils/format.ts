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
