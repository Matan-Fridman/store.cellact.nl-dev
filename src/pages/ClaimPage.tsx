import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ClaimCard } from "./claim/ClaimCard";
import { setUseProductionUrls } from "../config/constants";

/**
 * Mobile-optimised full-screen wrapper — no desktop navbar needed here.
 * This page is almost always opened on a phone via deep link / QR scan.
 */
export function ClaimPage() {
  const [searchParams] = useSearchParams();

  const secret       = searchParams.get("secret");
  const label        = searchParams.get("label");
  const walletAddress = searchParams.get("walletAddress");
  const dev          = searchParams.get("dev");

  useEffect(() => {
    if (dev === "false") setUseProductionUrls(true);
    else if (dev === "true") setUseProductionUrls(false);
  }, [dev]);

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Minimal wordmark — no nav clutter */}
      <header style={{ padding: "22px 28px" }}>
        <a
          href="/"
          style={{
            fontWeight: 700,
            fontSize: "1.05rem",
            color: "var(--color-text)",
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}
        >
          Secnum
        </a>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "16px 28px",
          paddingBottom: "max(40px, env(safe-area-inset-bottom, 40px))",
          maxWidth: "480px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {!secret || !label || !walletAddress ? (
          <InvalidLink />
        ) : (
          <ClaimCard params={{ secret, label, walletAddress }} />
        )}
      </main>
    </div>
  );
}

function InvalidLink() {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "14px",
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(96,165,250,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          margin: "0 auto 24px",
        }}
      >
        🔗
      </div>
      <h2
        style={{
          fontSize: "1.35rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--color-text)",
          marginBottom: "10px",
        }}
      >
        Invalid link
      </h2>
      <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--color-text-muted)" }}>
        This activation link is incomplete. Please use the link provided after
        your purchase or scan the QR code from the Arnacon app.
      </p>
    </div>
  );
}
