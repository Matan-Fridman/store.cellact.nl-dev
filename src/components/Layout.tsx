import { useState, useEffect, type ReactNode } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import type { Language } from "../i18n/translations";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [scrolled, setScrolled] = useState(false);
  const { lang, setLang, t } = useLanguage();

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
            {t.nav.brand}
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <LangToggle lang={lang} setLang={setLang} />
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              by Cellact
            </span>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function LangToggle({
  lang,
  setLang,
}: {
  lang: Language;
  setLang: (l: Language) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "3px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--color-border)",
      }}
    >
      {(["en", "he"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "4px 11px",
            borderRadius: "5px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            background: lang === l ? "rgba(255,255,255,0.1)" : "transparent",
            color:
              lang === l ? "var(--color-text)" : "var(--color-text-muted)",
          }}
        >
          {l === "en" ? "EN" : "HE"}
        </button>
      ))}
    </div>
  );
}
