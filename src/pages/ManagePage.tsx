import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import { getApiConfig, isCryptoEnabled } from "../config/constants";
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
  return new Date(ts * 1000).toLocaleDateString(lang === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildManageQrPayload(sessionId: string): string {
  const { QR_CONFIRM_URL } = getApiConfig();
  return (
    `arnacon://auth` +
    `?session=${encodeURIComponent(sessionId)}` +
    `&provider=Secnum` +
    `&endpoint=${encodeURIComponent(QR_CONFIRM_URL)}`
  );
}

export function ManagePage() {
  const { t, lang } = useLanguage();
  const copy = t.manage;
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [numbers, setNumbers] = useState<ManagedNumber[]>([]);
  const [qrPayload, setQrPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRef, setConfirmRef] = useState<string | null>(null);
  const [dialogPhase, setDialogPhase] = useState<"confirm" | "done">("confirm");
  const [doneRef, setDoneRef] = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);
  const pollRef = useRef<number | null>(null);
  const appliedRef = useRef(false);
  const doneTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopWait();
      if (doneTimerRef.current != null) window.clearTimeout(doneTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!confirmRef) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) closeDialog();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmRef, busy]);

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
      const session = await exchangeManageQr(sessionId);
      if (!session.token) return;
      applySession(session);
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
      setQrPayload(buildManageQrPayload(started.sessionId));
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
          // Client listen is optional. Polling qr-exchange is the source of truth.
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

  function openCancelDialog(paymentRef: string) {
    if (busy) return;
    setError(null);
    setDialogPhase("confirm");
    setConfirmRef(paymentRef);
  }

  function closeDialog() {
    if (busy) return;
    setConfirmRef(null);
    setDialogPhase("confirm");
  }

  async function onCancel(paymentRef: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await cancelManagedNumber(token, paymentRef);
      setNumbers(result.numbers);
      setDoneRef(paymentRef);
      setDialogPhase("done");
      if (doneTimerRef.current != null) window.clearTimeout(doneTimerRef.current);
      doneTimerRef.current = window.setTimeout(() => {
        setConfirmRef(null);
        setDialogPhase("confirm");
        doneTimerRef.current = null;
      }, 2400);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  const qrUrl = qrPayload ? buildQrUrl(qrPayload, 220) : "";
  const confirmingRow = numbers.find((row) => row.paymentRef === confirmRef) ?? null;
  const confirmingName = confirmingRow?.label
    ? formatIsraeliLocal(confirmingRow.label)
    : copy.unnamed;

  return (
    <Layout>
      <div className={`manage-page${step === "list" ? " is-list" : ""}`} style={{ ...pageWrap, alignItems: step === "list" ? "flex-start" : "center" }}>
        <div style={{ ...card, maxWidth: step === "list" ? "46rem" : "420px" }}>
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
                {isCryptoEnabled() ? (
                  <>
                    <Link to="/crypto/recover" style={linkBtn}>
                      {copy.cryptoPaidLink}
                    </Link>
                    <p style={{ ...sub, margin: 0 }}>{copy.cryptoPaid}</p>
                  </>
                ) : null}
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
                <>
                  <p style={sub}>{copy.empty}</p>
                  {isCryptoEnabled() ? (
                    <Link to="/crypto/recover" style={linkBtn}>
                      {copy.cryptoPaidLink}
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="crypto-order-table-wrap manage-list-wrap" style={{ marginTop: 0 }}>
                    <table className="crypto-order-table manage-list-table">
                      <thead>
                        <tr>
                          <th>{copy.colNumber}</th>
                          <th className="is-desk">{copy.colRail}</th>
                          <th>{copy.colStatus}</th>
                          <th className="is-desk">{copy.colAction}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {numbers.map((row) => {
                          const named = row.label ? formatIsraeliLocal(row.label) : copy.unnamed;
                          const nowSec = Math.floor(Date.now() / 1000);
                          const until = row.cancelEffective || (doneRef === row.paymentRef ? nowSec : 0);
                          const cancelled = until > 0 && until <= nowSec;
                          const stopping = until > nowSec;
                          const statusLabel = cancelled
                            ? copy.statusCancelled
                            : stopping
                              ? copy.statusStopping(formatWhen(until, lang === "he" ? "he" : "en"))
                              : copy.statusLive;
                          const canStop = row.rail === "stripe" && row.canCancel && doneRef !== row.paymentRef;
                          const canOpenCrypto = row.rail === "crypto" && isCryptoEnabled();
                          const railLabel = row.rail === "crypto" ? copy.railCrypto : copy.railCard;
                          const activateRow = () => {
                            if (canStop) openCancelDialog(row.paymentRef);
                            else if (canOpenCrypto) navigate("/crypto/recover");
                          };
                          const rowLive = canStop || canOpenCrypto;
                          return (
                            <tr
                              key={row.paymentRef}
                              className={rowLive ? "is-actionable" : "is-static"}
                              tabIndex={rowLive ? 0 : undefined}
                              role={rowLive ? "button" : undefined}
                              onClick={rowLive ? activateRow : undefined}
                              onKeyDown={
                                rowLive
                                  ? (event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        activateRow();
                                      }
                                    }
                                  : undefined
                              }
                            >
                              <td>
                                <span className="crypto-order-cell">
                                  <span className="crypto-order-name">
                                    <strong dir="ltr">{named}</strong>
                                    <small>
                                      {railLabel}
                                      {canStop ? ` · ${copy.cancelCta}` : null}
                                      {canOpenCrypto ? ` · ${copy.cryptoCancel}` : null}
                                    </small>
                                  </span>
                                </span>
                              </td>
                              <td className="is-desk">{railLabel}</td>
                              <td>
                                <span className={`crypto-status is-${stopping || cancelled ? "cancelled" : "live"}`}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="is-desk">
                                {canOpenCrypto ? (
                                  <Link
                                    to="/crypto/recover"
                                    className="crypto-order-link"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    {copy.cryptoCancel}
                                  </Link>
                                ) : canStop ? (
                                  <button
                                    type="button"
                                    className="crypto-order-link"
                                    disabled={busy}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openCancelDialog(row.paymentRef);
                                    }}
                                  >
                                    {copy.cancelCta}
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : null}

          {confirmingRow ? null : (
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          )}
          <Link to="/" style={backLink}>
            {copy.back}
          </Link>
        </div>
      </div>
      {confirmingRow ? (
        <div
          className="manage-dialog-overlay"
          onClick={() => {
            if (dialogPhase === "confirm") closeDialog();
          }}
        >
          <div
            className={`manage-dialog${dialogPhase === "done" ? " is-done" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            {dialogPhase === "done" ? (
              <>
                <span className="manage-check" aria-hidden="true">
                  <svg viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="24" fill="none" />
                    <path fill="none" d="M15 27 l8 8 14-16" />
                  </svg>
                </span>
                <h2 id="manage-dialog-title">{copy.cancelledTitle}</h2>
                <p>{copy.cancelled}</p>
                <p className="manage-dialog-number" dir="ltr">
                  {confirmingName}
                </p>
              </>
            ) : (
              <>
                <h2 id="manage-dialog-title">{copy.confirmTitle}</h2>
                <p className="manage-dialog-number" dir="ltr">
                  {confirmingName}
                </p>
                <p>{copy.confirmBody(confirmingName)}</p>
                <ErrorAlert message={error} onDismiss={() => setError(null)} />
                <div className="manage-dialog-actions">
                  <Button
                    onClick={() => void onCancel(confirmingRow.paymentRef)}
                    loading={busy}
                    disabled={busy}
                  >
                    {copy.confirmCancel}
                  </Button>
                  <Button variant="secondary" onClick={closeDialog} disabled={busy}>
                    {copy.keepNumber}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </Layout>
  );
}

const pageWrap: CSSProperties = {
  minHeight: "calc(100vh - 72px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
