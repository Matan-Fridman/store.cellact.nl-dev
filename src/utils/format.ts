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
  lang?: "en" | "he",
): string {
  const base = storeOrigin.replace(/\/$/, "");
  const params = new URLSearchParams({
    secret: userSecret,
    label,
  });
  if (prod !== undefined) params.set("dev", prod ? "false" : "true");
  if (lang === "he" || lang === "en") params.set("lang", lang);
  const claimPage = `${base}/claim?${params.toString()}`;
  return `arnacon://install?url=${encodeURIComponent(claimPage)}&provider=Secnum`;
}

export function buildArnaconRecoverUrl(
  token: string,
  storeOrigin: string,
  lang?: "en" | "he",
): string {
  const base = storeOrigin.replace(/\/$/, "");
  const params = new URLSearchParams({ token });
  if (lang === "he" || lang === "en") params.set("lang", lang);
  const recoverPage = `${base}/recover?${params.toString()}`;
  return `arnacon://install?url=${encodeURIComponent(recoverPage)}&provider=Secnum`;
}

/**
 * Ensures the `dev` (and optional `lang`) params inside an arnacon:// deep link
 * match the current environment / purchase language.
 *
 * arnacon://install?url=<encoded /claim page>&provider=Secnum
 */
export function ensureClaimUrlDevParam(
  claimUrl: string,
  prod: boolean,
  lang?: "en" | "he",
): string {
  try {
    const qIndex = claimUrl.indexOf("?");
    if (qIndex === -1) return claimUrl;

    const rawParams = claimUrl.slice(qIndex + 1);
    const params = new URLSearchParams(rawParams);
    const encodedInner = params.get("url");
    if (!encodedInner) return claimUrl;

    const inner = new URL(decodeURIComponent(encodedInner));
    inner.searchParams.set("dev", prod ? "false" : "true");
    if (lang === "he" || lang === "en") {
      inner.searchParams.set("lang", lang);
    }

    params.set("url", inner.toString());
    return claimUrl.slice(0, qIndex + 1) + params.toString();
  } catch {
    return claimUrl;
  }
}
