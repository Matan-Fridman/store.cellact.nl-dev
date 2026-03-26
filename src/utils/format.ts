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
): string {
  const base = storeOrigin.replace(/\/$/, "");
  const claimPage = `${base}/claim?secret=${encodeURIComponent(userSecret)}&label=${encodeURIComponent(label)}`;
  return `arnacon://install?url=${encodeURIComponent(claimPage)}&provider=Secnum`;
}
