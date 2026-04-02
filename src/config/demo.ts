/**
 * DEMO MODE — bypasses Stripe checkout and order-result polling entirely.
 *
 * Enable:  set VITE_DEMO_MODE=true in .env.local
 * Revert:  remove the variable (or set to false) and delete this file's import in usePurchase.ts
 */

// Build-time only — Vite replaces this at compile time.
// On Vercel (production), VITE_DEMO_MODE is not set so this is always false.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export interface DemoResult {
  userSecret: string;
  label: string;
}

// ── Paste pre-provisioned pairs here ─────────────────────────────────────────
// Each entry is a {userSecret, label} returned by a prior real blockchain call.
// The demo cycles through them in order, wrapping around.
export const DEMO_RESULTS: DemoResult[] = [
  { userSecret: "0x33851d9b65489dd3b354ffded6b4768181f2bcabfc95b2bcb2506f2597c9e8f5", label: "972557012406" },
  { userSecret: "0xd7064e4be516604d91c71cc3f07cefa0e1de774e7b1af2396a17c41739c2d09e", label: "972557012405" }
];
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_INDEX_KEY = "secnum_demo_index";

/** Returns the next pre-provisioned result (cycles through the list). */
export function nextDemoResult(): DemoResult | null {
  if (DEMO_RESULTS.length === 0) return null;
  const stored = parseInt(localStorage.getItem(DEMO_INDEX_KEY) ?? "0", 10);
  const index = isNaN(stored) ? 0 : stored % DEMO_RESULTS.length;
  localStorage.setItem(DEMO_INDEX_KEY, String((index + 1) % DEMO_RESULTS.length));
  return DEMO_RESULTS[index];
}
