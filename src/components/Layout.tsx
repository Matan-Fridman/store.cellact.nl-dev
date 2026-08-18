import React, { useState, useEffect, type ReactNode } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import type { Language } from "../i18n/translations";

interface LayoutProps {
  children: ReactNode;
  /** Hide App Store / Play badges — they compete with buy CTA on FB landings */
  hideAppStoreBadges?: boolean;
  onBuy?: () => void;
  buyLabel?: string;
  buyLoading?: boolean;
}

export function Layout({
  children,
  hideAppStoreBadges = false,
  onBuy,
  buyLabel,
  buyLoading = false,
}: LayoutProps) {
  const [scrolled, setScrolled] = useState(false);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg)" }}
      data-hide-store-badges={hideAppStoreBadges ? "1" : undefined}
    >
      <header
        className={`site-header fixed top-0 left-0 right-0 z-50 transition-all duration-300${scrolled ? " is-scrolled" : ""}`}
      >
        <div className="site-header-inner mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="site-header-brand text-xl font-bold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            {t.nav.brand}
          </a>

          <div className="site-header-controls" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {!hideAppStoreBadges && <AppStoreBadges />}
            {onBuy && buyLabel && (
              <button
                type="button"
                className="landing-header-buy"
                onClick={onBuy}
                disabled={buyLoading}
              >
                {buyLabel}
              </button>
            )}
            <LangToggle lang={lang} setLang={setLang} />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function AppStoreBadges() {
  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "5px 12px",
    borderRadius: "8px",
    textDecoration: "none",
    transition: "border-color 0.2s, background 0.2s",
    cursor: "pointer",
  };

  return (
    <div className="app-store-badges" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <a
        className="app-store-badge"
        href="https://apps.apple.com/app/arnacon/id6504406464"
        target="_blank"
        rel="noopener noreferrer"
        style={badgeStyle}
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" width="13" height="16" alt="Apple" />
        <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          App Store
        </span>
      </a>

      <a
        className="app-store-badge"
        href="https://play.google.com/store/apps/details?id=com.arnacon.app"
        target="_blank"
        rel="noopener noreferrer"
        style={badgeStyle}
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" width="14" height="14" alt="Google Play" />
        <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          Google Play
        </span>
      </a>
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
      className="language-toggle"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "3px",
        borderRadius: "8px",
      }}
    >
      {(lang === "he" ? (["he", "en"] as Language[]) : (["en", "he"] as Language[])).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={lang === l ? "is-active" : undefined}
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
            background: "transparent",
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
