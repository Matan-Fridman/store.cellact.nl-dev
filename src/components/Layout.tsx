import { useState, useEffect, type ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(12,11,20,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            Secnum
          </a>
          <span
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            by Cellact
          </span>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
