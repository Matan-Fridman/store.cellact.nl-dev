import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
}

/**
 * Small pill label used to introduce a section or headline.
 * Styled with a subtle border + gradient text.
 */
export function Badge({ children }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase"
      style={{
        border: "1px solid rgba(196,91,255,0.35)",
        background: "rgba(142,45,226,0.12)",
        color: "#C45BFF",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
}
