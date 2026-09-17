import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import { buildQrUrl } from "../utils/format";
import { normalizeIsraeliNumber, buildPortQrPayload } from "../services/portApi";
import { usePortSession } from "../hooks/usePortSession";

// ─── Shared animation preset ──────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PortPage() {
  const hook = usePortSession();

  return (
    <Layout>
      {/* Background atmosphere — matches home page blue glow */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(37,99,235,0.09) 0%, rgba(59,130,246,0.04) 50%, transparent 75%)",
            filter: "blur(80px)",
          }}
        />
        {/* Subtle purple accent — top right */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(142,45,226,0.06) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Page content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "calc(100vh - 72px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px 60px",
        }}
      >
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          style={{ textAlign: "center", marginBottom: "48px", maxWidth: "520px" }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: "16px",
            }}
          >
            Number Porting
          </p>
          <h1
            style={{
              fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.04,
              color: "var(--color-text)",
              marginBottom: "16px",
            }}
          >
            Bring your number{" "}
            <span className="gradient-text">to Arnacon.</span>
          </h1>
          <p
            style={{
              fontSize: "1.0625rem",
              lineHeight: 1.65,
              color: "var(--color-text-muted)",
            }}
          >
            Keep your existing Israeli mobile number and activate it on the Arnacon network.
          </p>
        </motion.div>

        {/* Step progress track */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ marginBottom: "36px" }}
        >
          <StepTrack currentStep={
            hook.step === "init" || hook.step === "qr" ? 1
            : hook.step === "authenticated" ? 2
            : hook.step === "submitted" ? 3
            : 1
          } />
        </motion.div>

        {/* Active card */}
        <div style={{ width: "100%", maxWidth: "480px" }}>
          <AnimatePresence mode="wait">
            {(hook.step === "init" || hook.step === "qr") && (
              <QRLoginStep key="qr" hook={hook} />
            )}
            {hook.step === "authenticated" && (
              <NumberEntryStep key="number" hook={hook} />
            )}
            {hook.step === "submitted" && (
              <SubmittedStep key="done" hook={hook} />
            )}
            {hook.step === "error" && (
              <ErrorStep key="error" hook={hook} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

// ─── Step track ───────────────────────────────────────────────────────────────

function StepTrack({ currentStep }: { currentStep: number }) {
  const steps = ["Connect wallet", "Enter number", "Done"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < currentStep;
        const active = n === currentStep;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  transition: "all 0.4s ease",
                  background: done
                    ? "rgba(59,130,246,0.2)"
                    : active
                    ? "rgba(59,130,246,0.15)"
                    : "var(--color-bg-raised)",
                  border: done
                    ? "1px solid rgba(96,165,250,0.5)"
                    : active
                    ? "1px solid rgba(96,165,250,0.6)"
                    : "1px solid var(--color-border)",
                  color: done || active ? "#60a5fa" : "var(--color-text-muted)",
                  boxShadow: active ? "0 0 16px rgba(59,130,246,0.25)" : "none",
                }}
              >
                {done ? "✓" : n}
              </div>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  color: active ? "var(--color-text)" : "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                  transition: "color 0.3s",
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                style={{
                  width: "80px",
                  height: "1px",
                  margin: "0 8px",
                  marginBottom: "20px",
                  background: n < currentStep
                    ? "rgba(96,165,250,0.4)"
                    : "var(--color-border)",
                  transition: "background 0.4s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 – QR Login ────────────────────────────────────────────────────────

function QRLoginStep({ hook }: { hook: ReturnType<typeof usePortSession> }) {
  const isLoading = hook.step === "init";
  const qrUrl = hook.session
    ? buildQrUrl(buildPortQrPayload(hook.session), 220)
    : null;

  useEffect(() => {
    hook.startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div {...fadeUp}>
      {/* Card */}
      <div
        style={{
          padding: "36px 32px",
          borderRadius: "24px",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border)",
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "28px",
        }}
      >
        {/* Text */}
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--color-text)",
              marginBottom: "8px",
            }}
          >
            Scan with Arnacon
          </h2>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--color-text-muted)", maxWidth: "30ch", margin: "0 auto" }}>
            Open the Arnacon app, tap{" "}
            <strong style={{ color: "var(--color-text)", fontWeight: 600 }}>Scan</strong>
            , and point your camera here to verify your identity.
          </p>
        </div>

        {/* QR */}
        {isLoading ? (
          <QRSkeleton />
        ) : (
          <div style={{ position: "relative" }}>
            {/* Blue outer glow */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-20px",
                borderRadius: "28px",
                background: "radial-gradient(ellipse at center, rgba(59,130,246,0.14) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* QR white card */}
            <div
              style={{
                position: "relative",
                padding: "16px",
                borderRadius: "18px",
                background: "#ffffff",
                boxShadow:
                  "0 0 0 1px rgba(96,165,250,0.25), 0 24px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* Corner decorations */}
              {([
                { top: 7, left: 7 },
                { top: 7, right: 7 },
                { bottom: 7, left: 7 },
                { bottom: 7, right: 7 },
              ] as const).map((pos, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: "16px",
                    height: "16px",
                    borderColor: "#3b82f6",
                    borderStyle: "solid",
                    borderTopWidth:    "bottom" in pos ? 0 : "2.5px",
                    borderBottomWidth: "top"    in pos ? 0 : "2.5px",
                    borderLeftWidth:   "right"  in pos ? 0 : "2.5px",
                    borderRightWidth:  "left"   in pos ? 0 : "2.5px",
                    borderRadius:
                      "top" in pos && "left"   in pos ? "4px 0 0 0"
                    : "top" in pos && "right"  in pos ? "0 4px 0 0"
                    : "bottom" in pos && "left"  in pos ? "0 0 0 4px"
                    : "0 0 4px 0",
                    ...pos,
                  }}
                />
              ))}
              <img
                src={qrUrl!}
                alt="Scan with Arnacon to authenticate"
                width={190}
                height={190}
                style={{ display: "block" }}
              />
            </div>
          </div>
        )}

        {/* Status row */}
        {!isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 16px",
              borderRadius: "99px",
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(96,165,250,0.15)",
            }}
          >
            <PulseDot />
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Waiting for Arnacon app…
            </span>
          </div>
        )}
      </div>

      {/* Refresh */}
      {!isLoading && (
        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <button
            type="button"
            onClick={hook.startSession}
            className="btn-secondary"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "12.5px",
              color: "var(--color-text-muted)",
              padding: "4px 8px",
              borderRadius: "6px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          >
            Code expired? Generate a new one ↺
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Step 2 – Number Entry ────────────────────────────────────────────────────

function NumberEntryStep({ hook }: { hook: ReturnType<typeof usePortSession> }) {
  const [raw, setRaw] = useState("");
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [email, setEmail] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);

  const normalized = normalizeIsraeliNumber(raw);
  const phoneValid = normalized !== null;
  const showPhoneError = touchedPhone && raw.trim() !== "" && !phoneValid;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showEmailError = touchedEmail && email.trim() !== "" && !emailValid;

  const canSubmit = phoneValid && emailValid;

  const handleSubmit = () => {
    setTouchedPhone(true);
    setTouchedEmail(true);
    if (!canSubmit || !normalized) return;
    hook.submitPort(normalized, email.trim());
  };

  const walletShort = hook.walletAddress
    ? `${hook.walletAddress.slice(0, 6)}…${hook.walletAddress.slice(-4)}`
    : "";

  return (
    <motion.div {...fadeUp}>
      <div
        style={{
          padding: "36px 32px",
          borderRadius: "24px",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border)",
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Wallet confirmed */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: "10px",
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(52,211,153,0.18)",
          }}
        >
          <span style={{ fontSize: "13px", color: "#059669" }}>✓</span>
          <span style={{ fontSize: "12.5px", color: "var(--color-text-muted)" }}>
            Wallet verified:
          </span>
          <span
            style={{
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#059669",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {walletShort}
          </span>
        </div>

        {/* Heading */}
        <div>
          <h2
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--color-text)",
              marginBottom: "6px",
            }}
          >
            Your details
          </h2>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--color-text-muted)" }}>
            Enter the number you want to port and your email for updates.
          </p>
        </div>

        {/* Phone input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Israeli mobile number
          </label>
          <div style={{ position: "relative" }}>
            {/* Flag + prefix */}
            <div
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: "18px", lineHeight: 1 }}>🇮🇱</span>
              <span
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.02em",
                }}
              >
                +972
              </span>
              <div
                style={{
                  width: "1px",
                  height: "18px",
                  background: "var(--color-border)",
                  marginLeft: "2px",
                }}
              />
            </div>

            <input
              type="tel"
              placeholder="05X-XXX-XXXX"
              value={raw}
              autoFocus
              onChange={(e) => { setRaw(e.target.value); setTouchedPhone(false); }}
              onBlur={() => setTouchedPhone(true)}
              style={{
                width: "100%",
                paddingLeft: "104px",
                paddingRight: "16px",
                paddingTop: "15px",
                paddingBottom: "15px",
                borderRadius: "12px",
                border: `1px solid ${
                  showPhoneError
                    ? "rgba(239,68,68,0.5)"
                    : phoneValid && raw
                    ? "rgba(96,165,250,0.4)"
                    : "var(--color-border)"
                }`,
                background: "var(--color-bg-raised)",
                color: "var(--color-text)",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: phoneValid && raw ? "0 0 0 3px rgba(59,130,246,0.08)" : "none",
              }}
            />
          </div>

          {/* Phone feedback */}
          <AnimatePresence>
            {showPhoneError && (
              <motion.p
                key="phone-err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: "12px", color: "rgba(239,68,68,0.85)", paddingLeft: "2px" }}
              >
                Enter a valid Israeli mobile number — e.g. 050-123-4567 or +972501234567
              </motion.p>
            )}
            {phoneValid && normalized && (
              <motion.p
                key="phone-ok"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: "12px", color: "#60a5fa", paddingLeft: "2px", fontFamily: "ui-monospace, monospace" }}
              >
                ✓ Will be ported as +{normalized}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Email input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setTouchedEmail(false); }}
            onBlur={() => setTouchedEmail(true)}
            style={{
              width: "100%",
              padding: "15px 16px",
              borderRadius: "12px",
              border: `1px solid ${
                showEmailError
                  ? "rgba(239,68,68,0.5)"
                  : emailValid && email
                  ? "rgba(96,165,250,0.4)"
                  : "var(--color-border)"
              }`,
              background: "var(--color-bg-raised)",
              color: "var(--color-text)",
              fontSize: "1rem",
              fontWeight: 500,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s, box-shadow 0.2s",
              boxShadow: emailValid && email ? "0 0 0 3px rgba(59,130,246,0.08)" : "none",
            }}
          />

          {/* Email feedback */}
          <AnimatePresence>
            {showEmailError && (
              <motion.p
                key="email-err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: "12px", color: "rgba(239,68,68,0.85)", paddingLeft: "2px" }}
              >
                Enter a valid email address.
              </motion.p>
            )}
            {emailValid && email && (
              <motion.p
                key="email-ok"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: "12px", color: "#60a5fa", paddingLeft: "2px" }}
              >
                ✓ {email.trim()}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <ErrorAlert message={hook.error} onDismiss={() => {}} />

        {/* Gradient ring around the CTA — per brand rules */}
        <div
          style={{
            borderRadius: "14px",
            padding: "1px",
            background: "linear-gradient(135deg, #8fd4ff, #4aa3f5)",
          }}
        >
          <Button
            onClick={handleSubmit}
            loading={hook.submitting}
            disabled={hook.submitting || !raw.trim() || !email.trim()}
            className="!rounded-[13px] !py-4 !text-base"
          >
            {hook.submitting ? "Submitting…" : "Submit Porting Request"}
          </Button>
        </div>

        <p style={{ fontSize: "11.5px", color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.5 }}>
          Your number stays active while porting is in progress.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Step 3 – Submitted ───────────────────────────────────────────────────────

function SubmittedStep({ hook }: { hook: ReturnType<typeof usePortSession> }) {
  const number = hook.submittedNumber
    ? `+${hook.submittedNumber}`
    : "your number";

  const steps = [
    {
      n: "1",
      color: "#60a5fa",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(96,165,250,0.2)",
      title: "Check your SMS",
      desc: `We sent a verification message to ${number}. Follow the instructions in the SMS to confirm you own this number.`,
    },
    {
      n: "2",
      color: "#a78bfa",
      bg: "rgba(139,92,246,0.08)",
      border: "rgba(167,139,250,0.2)",
      title: "Verification complete",
      desc: "Once you complete the SMS flow, we'll confirm your number ownership and prepare the transfer.",
    },
    {
      n: "3",
      color: "#059669",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(52,211,153,0.2)",
      title: "Pay & receive in Arnacon",
      desc: "You'll get a notification in the Arnacon app with a payment link. After paying, your number is live on the network.",
    },
  ];

  return (
    <motion.div {...fadeUp}>
      <div
        style={{
          padding: "36px 32px",
          borderRadius: "24px",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border)",
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(52,211,153,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
              boxShadow: "0 0 32px rgba(16,185,129,0.1)",
            }}
          >
            ✓
          </motion.div>
          <div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--color-text)",
                marginBottom: "3px",
              }}
            >
              Request received
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
              An SMS is on its way to{" "}
              <span style={{ color: "var(--color-text)", fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>
                {number}
              </span>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--color-border)" }} />

        {/* Numbered steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <p
            style={{
              fontSize: "10.5px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: "2px",
            }}
          >
            What happens next
          </p>

          {steps.map(({ n, color, bg, border, title, desc }, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px",
                borderRadius: "12px",
                background: bg,
                border: `1px solid ${border}`,
              }}
            >
              {/* Step number bubble */}
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#f0f6fb",
                  border: `1px solid ${border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color,
                  flexShrink: 0,
                  marginTop: "1px",
                }}
              >
                {n}
              </div>
              <div>
                <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text)", marginBottom: "4px" }}>
                  {title}
                </p>
                <p style={{ fontSize: "12.5px", color: "var(--color-text-muted)", lineHeight: 1.55 }}>
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reset link */}
        <button
          type="button"
          onClick={hook.reset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "12.5px",
            color: "var(--color-text-muted)",
            padding: 0,
            textAlign: "center",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
        >
          Port a different number →
        </button>
      </div>
    </motion.div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorStep({ hook }: { hook: ReturnType<typeof usePortSession> }) {
  return (
    <motion.div {...fadeUp}>
      <div
        style={{
          padding: "40px 32px",
          borderRadius: "24px",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border)",
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
          }}
        >
          ⚠️
        </div>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-text)", marginBottom: "8px" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {hook.error ?? "An unexpected error occurred."}
          </p>
        </div>
        <Button onClick={hook.startSession} fullWidth={false} className="!px-8 !py-3">
          Try again
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function QRSkeleton() {
  return (
    <div
      style={{
        width: "222px",
        height: "222px",
        borderRadius: "18px",
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          border: "2.5px solid rgba(59,130,246,0.2)",
          borderTopColor: "#60a5fa",
          animation: "spin 0.85s linear infinite",
        }}
      />
    </div>
  );
}

function PulseDot() {
  return (
    <motion.div
      animate={{ opacity: [1, 0.25, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#60a5fa",
        flexShrink: 0,
        boxShadow: "0 0 6px rgba(96,165,250,0.6)",
      }}
    />
  );
}
