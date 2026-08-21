import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import { useLanguage } from "../contexts/LanguageContext";
import { getDb } from "../lib/firebase";
import {
  ApiError,
  cancelManagedNumber,
  exchangeManageQr,
  startManageEmail,
  startManageQr,
  verifyManageEmail,
  type ManagedNumber,
  type ManageSessionResult,
} from "../services/api";
import { buildQrUrl, formatIsraeliLocal } from "../utils/format";

type Step = "choose" | "qr" | "email" | "code" | "list";

function formatWhen(ts: number, lang: "en" | "he"): string {
  return new Date(ts * 1000).toLocaleString(lang === "he" ? "he-IL" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildManageQrPayload(sessionId: string, confirmEndpoint: string): string {
  return (
    `arnacon://auth` +
    `?session=${encodeURIComponent(sessionId)}` +
    `&provider=Secnum` +
    `&endpoint=${encodeURIComponent(confirmEndpoint)}`
  );
}

export function ManagePage() {
  const { t, lang } = useLanguage();
  const copy = t.manage;
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [numbers, setNumbers] = useState<ManagedNumber[]>([]);
  const [qrPayload, setQrPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRef, setConfirmRef] = useState<string | null>(null);
  const [doneRef, setDoneRef] = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);
  const pollRef = useRef<number | null>(null);
  const appliedRef = useRef(false);

  useEffect(() => {
    return () => stopWait();
  }, []);

  function stopWait() {
    unsubRef.current?.();
    unsubRef.current = null;
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function applySession(session: ManageSessionResult) {
    if (appliedRef.current) return;
    appliedRef.current = true;
    stopWait();
    setToken(session.token);
    setNumbers(session.numbers);
    setStep("list");
    setBusy(false);
  }

  async function tryExchange(sessionId: string) {
    try {
      applySession(await exchangeManageQr(sessionId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) return;
      if (appliedRef.current) return;
      setError(err instanceof Error ? err.message : copy.error);
    }
  }

  async function onScan() {
    setBusy(true);
    setError(null);
    appliedRef.current = false;
    stopWait();
    try {
      const started = await startManageQr();
      setQrPayload(buildManageQrPayload(started.sessionId, started.confirmEndpoint));
      setStep("qr");
      unsubRef.current = onSnapshot(
        doc(getDb(), "qrLoginSessions", started.sessionId),
        (snap) => {
          const data = snap.data();
          if (data?.status === "confirmed" && data.address) {
            void tryExchange(started.sessionId);
          }
        },
        () => {
          setError(copy.error);
        },
      );
      pollRef.current = window.setInterval(() => {
        void tryExchange(started.sessionId);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  async function onEmail(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await startManageEmail(email, lang === "he" ? "he" : "en");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  async function onCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await verifyManageEmail(email, code);
      setToken(session.token);
      setNumbers(session.numbers);
      setStep("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  async function onCancel(paymentRef: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await cancelManagedNumber(token, paymentRef);
      setNumbers(result.numbers);
      setConfirmRef(null);
      setDoneRef(paymentRef);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  const qrUrl = qrPayload ? buildQrUrl(qrPayload, 220) : "";

  return (
    <Layout>
      <div style={pageWrap}>
        <div style={card}>
          {step === "choose" ? (
            <>
              <h1 style={titleStyle}>{copy.title}</h1>
              <p style={sub}>{copy.sub}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Button onClick={() => void onScan()} loading={busy} disabled={busy}>
                  {copy.scanCta}
                </Button>
                <Button variant="secondary" onClick={() => setStep("email")} disabled={busy}>
                  {copy.emailCta}
                </Button>
              </div>
            </>
          ) : null}

          {step === "qr" ? (
            <>
              <h1 style={titleStyle}>{copy.scanTitle}</h1>
              <p style={sub}>{copy.scanBody}</p>
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={copy.scanTitle}
                  width={220}
                  height={220}
                  style={{ alignSelf: "center", borderRadius: "16px" }}
                />
              ) : null}
              <p style={{ ...sub, marginTop: "16px", marginBottom: 0 }}>{copy.scanWait}</p>
              <Button
                variant="secondary"
                onClick={() => {
                  stopWait();
                  setStep("choose");
                }}
              >
                {copy.backChoose}
              </Button>
            </>
          ) : null}

          {step === "email" ? (
            <>
              <h1 style={titleStyle}>{copy.emailTitle}</h1>
              <p style={sub}>{copy.emailBody}</p>
              <form onSubmit={(e) => void onEmail(e)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                <Button type="submit" loading={busy} disabled={busy}>
                  {copy.sendCode}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setStep("choose")}>
                  {copy.backChoose}
                </Button>
              </form>
            </>
          ) : null}

          {step === "code" ? (
            <>
              <h1 style={titleStyle}>{copy.codeTitle}</h1>
              <p style={sub}>{copy.codeBody}</p>
              <form onSubmit={(e) => void onCode(e)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)" }}>
                    {copy.codeLabel}
                  </span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    style={inputStyle}
                  />
                </label>
                <Button type="submit" loading={busy} disabled={busy}>
                  {copy.verifyCode}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setStep("email")}>
                  {copy.backChoose}
                </Button>
              </form>
            </>
          ) : null}

          {step === "list" ? (
            <>
              <h1 style={titleStyle}>{copy.listTitle}</h1>
              <p style={sub}>{copy.listSub}</p>
              {numbers.length === 0 ? (
                <p style={sub}>{copy.empty}</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {numbers.map((row) => {
                    const named = row.label ? formatIsraeliLocal(row.label) : copy.unnamed;
                    const until = row.cancelEffective
                      ? copy.activeUntil(formatWhen(row.cancelEffective, lang === "he" ? "he" : "en"))
                      : null;
                    const confirming = confirmRef === row.paymentRef;
                    const done = doneRef === row.paymentRef;
                    return (
                      <li key={row.paymentRef} style={numberCard}>
                        <p dir="ltr" style={{ margin: 0, fontWeight: 800, fontSize: "1.05rem" }}>
                          {named}
                        </p>
                        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>
                          {row.rail === "crypto" ? copy.railCrypto : copy.railCard}
                          {until ? ` · ${until}` : ""}
                        </p>
                        {done ? <p style={{ margin: "10px 0 0", fontSize: "14px" }}>{copy.cancelled}</p> : null}
                        {row.rail === "crypto" ? (
                          <Link to="/crypto/recover" style={linkBtn}>
                            {copy.cryptoCancel}
                          </Link>
                        ) : confirming ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                            <p style={{ margin: 0, fontSize: "14px" }}>{copy.confirmBody(named)}</p>
                            <Button
                              onClick={() => void onCancel(row.paymentRef)}
                              loading={busy}
                              disabled={busy}
                            >
                              {copy.confirmCancel}
                            </Button>
                            <Button variant="secondary" onClick={() => setConfirmRef(null)} disabled={busy}>
                              {copy.keepNumber}
                            </Button>
                          </div>
                        ) : row.canCancel && !done ? (
                          <div style={{ marginTop: "12px" }}>
                            <Button
                              variant="secondary"
                              onClick={() => setConfirmRef(row.paymentRef)}
                              disabled={busy}
                            >
                              {copy.cancelCta}
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : null}

          <ErrorAlert message={error} onDismiss={() => setError(null)} />
          <Link to="/" style={backLink}>
            {copy.back}
          </Link>
        </div>
      </div>
    </Layout>
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
  gap: "16px",
};

const titleStyle: CSSProperties = {
  fontSize: "clamp(1.75rem, 7vw, 2.25rem)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  color: "var(--color-text)",
  margin: 0,
};

const sub: CSSProperties = {
  fontSize: "0.95rem",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
  margin: 0,
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

const numberCard: CSSProperties = {
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-raised)",
};

const backLink: CSSProperties = {
  display: "inline-block",
  marginTop: "8px",
  fontSize: "13px",
  color: "var(--color-text-muted)",
  textDecoration: "none",
};

const linkBtn: CSSProperties = {
  display: "inline-flex",
  marginTop: "12px",
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--color-text)",
};
