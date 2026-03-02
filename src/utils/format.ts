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
