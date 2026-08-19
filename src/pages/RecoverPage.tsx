import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import { useLanguage } from "../contexts/LanguageContext";
import { usePurchase } from "../hooks/usePurchase";
import { completeRecovery, requestRecovery } from "../services/api";
import {
  buildArnaconRecoverUrl,
  buildQrUrl,
  canonicalWeb3Identity,
  formatIsraeliLocal,
} from "../utils/format";

type RequestPhase =
  | "form"
  | "sent"
  | "not_customer"
  | "not_recoverable"
  | "error";

type CompletePhase = "working" | "done" | "error";

export function RecoverPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const web3identity = canonicalWeb3Identity(searchParams.get("web3identity") || "");

  if (token && web3identity) {
    return <CompleteFlow token={token} web3identity={web3identity} />;
  }
  if (token) return <OpenAppFlow token={token} />;
  return <RequestFlow />;
}

function RequestFlow() {
  const { t, lang } = useLanguage();
  const { status: buyStatus, error: buyError, initiate, reset } = usePurchase();
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<RequestPhase>("form");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const copy = t.recover;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await requestRecovery(email, lang === "he" ? "he" : "en");
      if (!result.customer) setPhase("not_customer");
      else if (!result.recoverable) setPhase("not_recoverable");
      else setPhase("sent");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : copy.errorTitle);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div style={pageWrap}>
        <div style={card}>
          <h1 style={titleStyle}>{copy.title}</h1>
          <p style={sub}>{copy.sub}</p>

          {phase === "form" || phase === "error" ? (
            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)" }}>
                  {copy.emailLabel}
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={copy.emailPlaceholder}
                  style={inputStyle}
                />
              </label>
              <ErrorAlert message={error} onDismiss={() => setError(null)} />
              <Button type="submit" loading={submitting} disabled={submitting}>
                {submitting ? copy.submitting : copy.submit}
              </Button>
            </form>
          ) : null}

          {phase === "sent" ? (
            <StatusBlock title={copy.sentTitle} body={copy.sentBody} />
          ) : null}

          {phase === "not_customer" || phase === "not_recoverable" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <StatusBlock
                title={phase === "not_customer" ? copy.notCustomerTitle : copy.notRecoverableTitle}
                body={phase === "not_customer" ? copy.notCustomerBody : copy.notRecoverableBody}
              />
              <Button onClick={initiate} loading={buyStatus === "loading"} disabled={buyStatus === "loading"}>
                {copy.notCustomerCta}
              </Button>
              <ErrorAlert message={buyError} onDismiss={reset} />
            </div>
          ) : null}

          <BackLink />
        </div>
      </div>
    </Layout>
  );
}

function OpenAppFlow({ token }: { token: string }) {
  const { t, lang } = useLanguage();
  const copy = t.recover;
  const recoverUrl = buildArnaconRecoverUrl(
    token,
    window.location.origin + (import.meta.env.BASE_URL.replace(/\/$/, "") || ""),
    lang === "he" ? "he" : "en",
  );
  const qrUrl = buildQrUrl(recoverUrl, 180);

  return (
    <Layout>
      <div style={pageWrap}>
        <div style={{ ...card, alignItems: "center", textAlign: "center" }}>
          <h1 style={titleStyle}>{copy.openTitle}</h1>
          <p style={sub}>{copy.openBody}</p>
          <img
            src={qrUrl}
            alt=""
            width={180}
            height={180}
            style={{
              display: "block",
              margin: "8px auto 20px",
              borderRadius: "12px",
              background: "#fff",
              padding: "12px",
            }}
          />
          <Button onClick={() => { window.location.href = recoverUrl; }}>
            {copy.openCta}
          </Button>
          <BackLink />
        </div>
      </div>
    </Layout>
  );
}

function CompleteFlow({ token, web3identity }: { token: string; web3identity: string }) {
  const { t } = useLanguage();
  const copy = t.recover;
  const calledRef = useRef(false);
  const [phase, setPhase] = useState<CompletePhase>("working");
  const [labels, setLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    completeRecovery(token, web3identity)
      .then((result) => {
        setLabels(result.labels || []);
        setPhase("done");
      })
      .catch((err: Error) => {
        setError(err.message || copy.errorTitle);
        setPhase("error");
      });
  }, [token, web3identity, copy.errorTitle]);

  return (
    <div style={{ minHeight: "100svh", background: "var(--color-bg)", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "22px 28px" }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-text)", textDecoration: "none" }}>
          {t.claim.brand}
        </Link>
      </header>
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 28px 40px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {phase === "working" ? (
            <StatusBlock title={copy.completingTitle} body={copy.completingBody} />
          ) : null}
          {phase === "done" ? (
            <div>
              <StatusBlock title={copy.doneTitle} body={copy.doneBody} />
              {labels.length > 0 ? (
                <div style={{ marginTop: "20px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                    {copy.numbersLabel}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    {labels.map((label) => (
                      <li
                        key={label}
                        dir="ltr"
                        style={{
                          padding: "12px 16px",
                          borderRadius: "12px",
                          border: "1px solid var(--color-border)",
                          fontWeight: 700,
                          unicodeBidi: "isolate",
                        }}
                      >
                        {formatIsraeliLocal(label)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
          {phase === "error" ? (
            <StatusBlock title={copy.errorTitle} body={error || copy.errorTitle} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function StatusBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h1 style={titleStyle}>{title}</h1>
      <p style={sub}>{body}</p>
    </div>
  );
}

function BackLink() {
  const { t } = useLanguage();
  return (
    <Link
      to="/"
      style={{
        display: "inline-block",
        marginTop: "20px",
        fontSize: "13px",
        color: "var(--color-text-muted)",
        textDecoration: "none",
      }}
    >
      {t.recover.back}
    </Link>
  );
}

const pageWrap: CSSProperties = {
  minHeight: "calc(100vh - 72px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
};

const card: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  display: "flex",
  flexDirection: "column",
};

const titleStyle: CSSProperties = {
  fontSize: "clamp(1.75rem, 7vw, 2.25rem)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  color: "var(--color-text)",
  margin: "0 0 12px",
};

const sub: CSSProperties = {
  fontSize: "0.95rem",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
  margin: "0 0 28px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-raised)",
  color: "var(--color-text)",
  fontSize: "16px",
};