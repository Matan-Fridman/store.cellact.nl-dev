import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { useLanguage } from "../contexts/LanguageContext";
import { showCryptoTestnetKicker } from "../config/constants";
import {
  CRYPTO_ESCROW,
  checkoutChainIds,
  chainCopyKey,
  escrowExplorerUrl,
  formatLockAmount,
  nativeSymbolFor,
  shortHex,
  useCryptoPurchase,
  cryptoErrorCopy,
  discoverWallets,
  type CryptoAsset,
  type CryptoChainId,
  type DiscoveredWallet,
  type WalletKind,
} from "../hooks/useCryptoPurchase";

export const PAYMYEMAIL_SITE = "https://paymyemail.com";
const BUYER_KEY = "secnum_crypto_buyer";

function readBuyer(): { name: string; email: string } {
  try {
    const raw = sessionStorage.getItem(BUYER_KEY);
    if (!raw) return { name: "", email: "" };
    const parsed = JSON.parse(raw) as { name?: string; email?: string };
    return { name: String(parsed.name || ""), email: String(parsed.email || "") };
  } catch {
    return { name: "", email: "" };
  }
}

function writeBuyer(name: string, email: string) {
  sessionStorage.setItem(BUYER_KEY, JSON.stringify({ name, email }));
}

function formatEur(value: number) {
  return `€${value.toFixed(2)}`;
}

const SUBSCRIBE_SNIPPET = `function subscribe(
    bytes32 orderId,
    uint256 serviceId,
    address token,
    uint256 setupAmount,
    uint256[] calldata periodAmounts,
    uint256 totalAmount,
    uint256 expiry,
    bytes calldata signature,
    string calldata orderRef
) external payable {
    if (orderUsed[orderId]) revert OrderUsed();
    if (block.timestamp > expiry) revert ExpiredQuote();
    if (_recover(digest, signature) != quoteSigner) revert BadQuoteSigner();

    if (token == address(0)) {
        if (msg.value != totalAmount) revert WrongPayment();
    } else {
        _pull(token, msg.sender, totalAmount);
    }

    orderUsed[orderId] = true;
    subscriptions[orderId] = Subscription({
        payer: msg.sender,
        start: uint64(block.timestamp),
        cancelEffective: 0,
        ...
    });
}`;

const CANCEL_SNIPPET = `function cancel(bytes32 orderId) external {
    Subscription storage sub = subscriptions[orderId];
    if (msg.sender != sub.payer) revert NotPayer();
    if (sub.cancelEffective != 0) revert CancelAlreadySet();

    // cancelEffective = end of the current 30-day period
    sub.cancelEffective = effective;

    uint256 unusedFrom = _unusedFrom(sub);
    uint256 amount;
    for (uint256 i = unusedFrom; i < periods.length; i++) {
        amount += periods[i];
        periods[i] = 0;
    }
    emit Cancelled(orderId, effective);
    if (amount > 0) {
        _push(sub.token, sub.payer, amount);
        emit UnusedWithdrawn(orderId, sub.payer, amount);
    }
}`;

type CryptoCopy = ReturnType<typeof useLanguage>["t"]["crypto"];

export function CryptoWalletPick({
  wallets,
  connecting,
  copy,
  onPick,
}: {
  wallets: DiscoveredWallet[];
  connecting: boolean;
  copy: {
    chooseWallet: string;
    walletMetaMask: string;
    walletPayMyEmail: string;
    walletNotInstalled: string;
    whatIsPayMyEmail: string;
  };
  onPick: (kind: WalletKind) => void;
}) {
  const rows: { kind: WalletKind; label: string }[] = [
    { kind: "metamask", label: copy.walletMetaMask },
    { kind: "paymyemail", label: copy.walletPayMyEmail },
  ];
  return (
    <div className="crypto-wallet-pick" role="group" aria-label={copy.chooseWallet}>
      {rows.map((row) => {
        const available = Boolean(wallets.find((item) => item.kind === row.kind)?.available);
        return (
          <div key={row.kind} className="crypto-wallet-pick-item">
            <button
              type="button"
              className="crypto-wallet-pick-btn"
              disabled={connecting}
              onClick={() => onPick(row.kind)}
            >
              <span>{row.label}</span>
              {!available && <span className="crypto-wallet-pick-hint">{copy.walletNotInstalled}</span>}
            </button>
            {row.kind === "paymyemail" && !available && (
              <a
                className="crypto-wallet-what"
                href={PAYMYEMAIL_SITE}
                target="_blank"
                rel="noreferrer"
              >
                {copy.whatIsPayMyEmail}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TokenLogo({ kind }: { kind: "pol" | "eth" | "usdc" }) {
  if (kind === "eth") {
    return (
      <svg className="crypto-token-logo" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <path fill="#fff" fillOpacity="0.6" d="M16.498 4v8.87l7.497 3.35z" />
        <path fill="#fff" d="M16.498 4 9 16.22l7.498-3.35z" />
        <path fill="#fff" fillOpacity="0.6" d="M16.498 21.968v6.027L24 17.616z" />
        <path fill="#fff" d="M16.498 27.995v-6.028L9 17.616z" />
        <path fill="#fff" fillOpacity="0.2" d="m16.498 20.573 7.497-4.353-7.497-3.348z" />
        <path fill="#fff" fillOpacity="0.6" d="m9 16.22 7.498 4.353v-7.701z" />
      </svg>
    );
  }
  if (kind === "usdc") {
    return (
      <svg className="crypto-token-logo" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#2775CA" />
        <path
          fill="#fff"
          d="M20.5 18.44c0-2.12-1.28-2.86-3.84-3.15-1.9-.27-2.28-.82-2.28-1.8 0-.99.73-1.67 2.16-1.67 1.44 0 2.24.55 2.5 1.9h2.72c-.3-2.16-1.74-3.8-4.76-4.16V7.5h-2.4v2.02c-2.72.33-4.48 2.08-4.48 4.42 0 2.8 1.68 3.76 4.14 4.12 2.08.3 2.5.74 2.5 1.86 0 1.1-.94 1.86-2.26 1.86-1.74 0-2.42-.74-2.66-2.08h-2.8c.28 2.5 2 4.28 5.04 4.62V24.5h2.4v-2.06c2.8-.28 4.72-2.14 4.72-4.6z"
        />
      </svg>
    );
  }
  return (
    <svg className="crypto-token-logo" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#6C47FF" />
      <path
        fill="#fff"
        d="M21.18 12.86c-.32-.18-.7-.18-1.04 0l-2.52 1.46-1.64.95-2.38 1.38c-.32.18-.7.18-1.04 0l-1.86-1.08c-.32-.18-.52-.52-.52-.9v-2.16c0-.38.2-.72.52-.9l1.86-1.08c.32-.18.7-.18 1.04 0l1.86 1.08c.32.18.52.52.52.9v1.44l1.64-.96v-1.5c0-.38-.2-.72-.52-.9l-3.48-2.02c-.32-.18-.7-.18-1.04 0L9.08 10.6c-.32.18-.52.52-.52.9v3.96c0 .38.2.72.52.9l3.5 2.04c.32.18.7.18 1.04 0l2.38-1.38 1.64-.96 2.38-1.38c.32-.18.7-.18 1.04 0l1.86 1.08c.32.18.52.52.52.9v2.16c0 .38-.2.72-.52.9l-1.86 1.08c-.32.18-.7.18-1.04 0l-1.86-1.08c-.32-.18-.52-.52-.52-.9v-1.44l-1.64.96v1.44c0 .38.2.72.52.9l3.5 2.04c.32.18.7.18 1.04 0l3.5-2.04c.32-.18.52-.52.52-.9v-3.96c0-.38-.2-.72-.52-.9z"
      />
    </svg>
  );
}

function nativeLogoKind(chainId: CryptoChainId): "pol" | "eth" {
  return nativeSymbolFor(chainId) === "ETH" ? "eth" : "pol";
}

function EscrowContracts({ copy }: { copy: CryptoCopy }) {
  const [copied, setCopied] = useState<CryptoChainId | null>(null);

  async function copyAddress(chainId: CryptoChainId) {
    await navigator.clipboard.writeText(CRYPTO_ESCROW[chainId]);
    setCopied(chainId);
    window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div className="crypto-article-chains">
      {checkoutChainIds().map((chainId) => {
        const address = CRYPTO_ESCROW[chainId];
        const name = copy[chainCopyKey(chainId)];
        return (
          <div key={chainId} className="crypto-article-chain">
            <p className="crypto-article-chain-name">{name}</p>
            <p className="crypto-article-chain-addr" dir="ltr">
              {shortHex(address)}
            </p>
            <p className="crypto-article-chain-addr is-full" dir="ltr">
              {address}
            </p>
            <div className="crypto-article-chain-actions">
              <button type="button" onClick={() => void copyAddress(chainId)}>
                {copied === chainId ? copy.copied : copy.copyAddress}
              </button>
              <a href={escrowExplorerUrl(chainId)} target="_blank" rel="noreferrer">
                {copy.openExplorer}
              </a>
            </div>
          </div>
        );
      })}
      <p className="crypto-article-chain-note">{copy.whySameAddress}</p>
    </div>
  );
}

function EscrowInfo({ copy }: { copy: CryptoCopy }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef(0);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);

  function cancelLeave() {
    window.clearTimeout(leaveTimer.current);
  }

  function scheduleLeave() {
    cancelLeave();
    leaveTimer.current = window.setTimeout(() => {
      if (!pinned) setOpen(false);
    }, 220);
  }

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  return (
    <div
      className="crypto-info"
      ref={wrapRef}
      onMouseEnter={() => {
        cancelLeave();
        setOpen(true);
      }}
      onMouseLeave={scheduleLeave}
    >
      <button
        type="button"
        className="crypto-info-btn"
        aria-label={copy.infoLabel}
        aria-expanded={open}
        aria-controls="crypto-escrow-info"
        onClick={() => {
          if (pinned) {
            setPinned(false);
            setOpen(false);
            return;
          }
          setPinned(true);
          setOpen(true);
        }}
      >
        i
      </button>
      {open && (
        <div className="crypto-info-pop" id="crypto-escrow-info" role="dialog" aria-label={copy.infoTitle}>
          <p className="crypto-info-title">{copy.infoTitle}</p>
          <p>{copy.infoBody}</p>
          <Link to="/crypto/why" onClick={() => setOpen(false)}>
            {copy.infoMore}
          </Link>
        </div>
      )}
    </div>
  );
}

function WhyArticle({ copy }: { copy: CryptoCopy }) {
  return (
    <Layout hideAppStoreBadges>
      <section className="crypto-article-page">
        <article className="crypto-article">
          <p className="crypto-checkout-back">
            <Link to="/crypto">{copy.whyBack}</Link>
          </p>
          {showCryptoTestnetKicker() ? (
            <p className="crypto-article-kicker">{copy.kicker}</p>
          ) : null}
          <h1>{copy.whyTitle}</h1>
          <p className="crypto-article-dek">{copy.whyLead}</p>

          <h2>{copy.whyRefuseTitle}</h2>
          <p>{copy.whyRefuse}</p>

          <h2>{copy.whyLockTitle}</h2>
          <p>{copy.whyLock}</p>

          <h2>{copy.whyExampleTitle}</h2>
          <p>{copy.whyExampleLead}</p>
          <ol className="crypto-article-months" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <li key={index} className={index === 0 ? "is-now" : "is-back"}>
                {index + 1}
              </li>
            ))}
          </ol>
          <ul className="crypto-article-legend">
            <li className="is-now">{copy.whyExampleNow}</li>
            <li className="is-back">{copy.whyExampleBack}</li>
          </ul>
          <p className="crypto-article-callout is-back">{copy.whyExampleNote}</p>

          <h2>{copy.whyCancelTitle}</h2>
          <p>{copy.whyCancelBody}</p>
          <p className="crypto-article-callout is-now">{copy.factLive}</p>
          <p className="crypto-article-callout is-lock">{copy.factLock}</p>

          <h2>{copy.whyTrustTitle}</h2>
          <p>{copy.whyTrust}</p>
          <h2>{copy.whyContractTitle}</h2>
          <EscrowContracts copy={copy} />

          <h2>{copy.whySubscribeTitle}</h2>
          <p>{copy.whySubscribeLead}</p>
          <pre dir="ltr">
            <code>{SUBSCRIBE_SNIPPET}</code>
          </pre>

          <h2>{copy.whyCodeTitle}</h2>
          <p>{copy.whyCodeLead}</p>
          <pre dir="ltr">
            <code>{CANCEL_SNIPPET}</code>
          </pre>
        </article>
      </section>
    </Layout>
  );
}

export function CryptoPage() {
  const { t } = useLanguage();
  const copy = t.crypto;
  const location = useLocation();
  const isWhy = location.pathname.endsWith("/why");
  const crypto = useCryptoPurchase();
  const storedBuyer = readBuyer();
  const [step, setStep] = useState<"details" | "purchase">(
    storedBuyer.name.trim() && storedBuyer.email.trim() ? "purchase" : "details",
  );
  const [buyerName, setBuyerName] = useState(storedBuyer.name);
  const [buyerEmail, setBuyerEmail] = useState(storedBuyer.email);
  const chains = checkoutChainIds();
  const [chainId, setChainId] = useState<CryptoChainId>(() => checkoutChainIds()[0]);
  const [asset, setAsset] = useState<CryptoAsset>("usdc");
  const [picking, setPicking] = useState(false);
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);
  const loading = crypto.status === "loading";
  const connected = Boolean(crypto.account);
  const nativeSymbol = nativeSymbolFor(chainId);
  const paySymbol = asset === "usdc" ? copy.usdc : nativeSymbol;
  const expectedSymbol = asset === "usdc" ? "USDC" : nativeSymbol;
  const quoteReady =
    crypto.quote && crypto.quote.chainId === chainId && crypto.quote.tokenSymbol === expectedSymbol
      ? crypto.quote
      : null;
  const total = quoteReady ? formatLockAmount(quoteReady.totalAmount, expectedSymbol) : null;
  const setupEur = Number.isFinite(Number(quoteReady?.setupEur)) ? Number(quoteReady?.setupEur) : null;
  const yearEur = Number.isFinite(Number(quoteReady?.yearEur)) ? Number(quoteReady?.yearEur) : null;
  const monthlyEur = Number.isFinite(Number(quoteReady?.monthlyEur)) ? Number(quoteReady?.monthlyEur) : null;
  const totalEur = Number.isFinite(Number(quoteReady?.totalEur))
    ? Number(quoteReady?.totalEur)
    : setupEur != null && yearEur != null
      ? Number((setupEur + yearEur).toFixed(2))
      : null;
  const buyer = { name: buyerName.trim(), email: buyerEmail.trim() };

  useEffect(() => {
    if (isWhy || step !== "purchase" || !buyer.name || !buyer.email) return;
    void crypto.loadQuote(chainId, asset, buyer).catch(() => undefined);
  }, [chainId, asset, crypto.loadQuote, isWhy, step, buyer.name, buyer.email]);

  async function openPicker() {
    setPickError(null);
    setPicking(true);
    crypto.reset();
    setWallets(await discoverWallets());
  }

  async function pickWallet(kind: WalletKind) {
    setPickError(null);
    const list = await discoverWallets();
    setWallets(list);
    if (!list.find((item) => item.kind === kind)?.available) {
      setPickError(kind === "paymyemail" ? copy.installPayMyEmail : copy.installMetaMask);
      return;
    }
    const ok = await crypto.connect(kind);
    if (ok) setPicking(false);
  }

  function goPurchase() {
    if (!buyer.name || !buyer.email) return;
    writeBuyer(buyer.name, buyer.email);
    setStep("purchase");
  }

  if (isWhy) {
    return <WhyArticle copy={copy} />;
  }

  return (
    <Layout hideAppStoreBadges>
      <section className="crypto-checkout">
        <div className="crypto-checkout-frame">
          <p className="crypto-checkout-back">
            {step === "purchase" ? (
              <button type="button" onClick={() => setStep("details")}>
                {copy.changeDetails}
              </button>
            ) : (
              <Link to="/">{copy.back}</Link>
            )}
          </p>
          <ol className="crypto-checkout-steps is-two" aria-label={copy.title}>
            <li className={step === "details" ? "is-current" : "is-done"}>{copy.stepDetails}</li>
            <li className={step === "purchase" ? "is-current" : ""}>{copy.stepPurchase}</li>
          </ol>
          {showCryptoTestnetKicker() ? (
            <p className="crypto-checkout-kicker">{copy.kicker}</p>
          ) : null}
          <h1>{step === "details" ? copy.detailsTitle : copy.title}</h1>
          <p className="crypto-checkout-special">{copy.specialPrice}</p>
          <p className="crypto-checkout-lead">
            {step === "details" ? copy.detailsLead : copy.lead}
          </p>

          {step === "details" ? (
            <form
              className="crypto-checkout-form"
              onSubmit={(event) => {
                event.preventDefault();
                goPurchase();
              }}
            >
              <label className="crypto-checkout-label" htmlFor="crypto-buyer-name">
                {copy.nameLabel}
              </label>
              <input
                id="crypto-buyer-name"
                className="crypto-checkout-input"
                autoComplete="name"
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
                placeholder={copy.namePlaceholder}
              />
              <label className="crypto-checkout-label" htmlFor="crypto-buyer-email">
                {copy.emailLabel}
              </label>
              <input
                id="crypto-buyer-email"
                className="crypto-checkout-input"
                autoComplete="email"
                inputMode="email"
                value={buyerEmail}
                onChange={(event) => setBuyerEmail(event.target.value)}
                placeholder={copy.emailPlaceholder}
              />
              <Button type="submit" disabled={!buyer.name || !buyer.email}>
                {copy.detailsContinue}
              </Button>
              <p className="crypto-checkout-recover">
                {copy.recoverDetails} <Link to="/crypto/recover">{copy.recoverLink}</Link>
              </p>
            </form>
          ) : (
            <>
          <div className="crypto-checkout-wallet">
            <span
              className={`crypto-checkout-wallet-dot${connected ? " is-on" : ""}`}
              aria-hidden="true"
            />
            <p className="crypto-checkout-wallet-copy">
              {connected ? (
                <>
                  <strong>{crypto.walletName}</strong>
                  <span className="crypto-checkout-wallet-id">{crypto.accountShort}</span>
                </>
              ) : picking ? (
                copy.chooseWallet
              ) : (
                copy.walletOff
              )}
            </p>
            {connected ? (
              <button
                type="button"
                className="crypto-checkout-wallet-action"
                onClick={() => {
                  crypto.disconnect();
                  void openPicker();
                }}
                disabled={crypto.connecting || loading}
              >
                {copy.changeWallet}
              </button>
            ) : !picking ? (
              <button
                type="button"
                className="crypto-checkout-wallet-action"
                onClick={() => void openPicker()}
                disabled={crypto.connecting || loading}
              >
                {crypto.connecting ? copy.connecting : copy.connect}
              </button>
            ) : null}
          </div>

          {picking && !connected && (
            <CryptoWalletPick
              wallets={wallets}
              connecting={crypto.connecting}
              copy={copy}
              onPick={(kind) => void pickWallet(kind)}
            />
          )}

          {(pickError || crypto.error) && (
            <p className="crypto-checkout-error" role="alert">
              <button
                type="button"
                className="crypto-checkout-error-text"
                onClick={() => {
                  setPickError(null);
                  crypto.reset();
                }}
              >
                {pickError || cryptoErrorCopy(copy, crypto.error)}
              </button>
              {pickError === copy.installPayMyEmail && (
                <a href={PAYMYEMAIL_SITE} target="_blank" rel="noreferrer">
                  {copy.whatIsPayMyEmail}
                </a>
              )}
            </p>
          )}

          <label className="crypto-checkout-label" htmlFor={`crypto-network-${chains[0]}`}>
            {copy.network}
          </label>
          <div className="crypto-checkout-seg" role="radiogroup" aria-label={copy.network}>
            {chains.map((id) => (
              <button
                key={id}
                id={`crypto-network-${id}`}
                type="button"
                aria-pressed={chainId === id}
                onClick={() => setChainId(id)}
              >
                <TokenLogo kind={nativeLogoKind(id)} />
                {copy[chainCopyKey(id)]}
              </button>
            ))}
          </div>

          <label className="crypto-checkout-label" htmlFor="crypto-token-usdc">
            {copy.token}
          </label>
          <div className="crypto-checkout-seg" role="radiogroup" aria-label={copy.token}>
            <button
              id="crypto-token-usdc"
              type="button"
              aria-pressed={asset === "usdc"}
              onClick={() => setAsset("usdc")}
            >
              <TokenLogo kind="usdc" />
              {copy.usdc}
            </button>
            <button
              type="button"
              aria-pressed={asset === "native"}
              onClick={() => setAsset("native")}
            >
              <TokenLogo kind={nativeLogoKind(chainId)} />
              {nativeSymbol}
            </button>
          </div>

          <div className="crypto-checkout-charge">
            <ul className="crypto-checkout-bill">
              <li>
                <div>
                  <p>{copy.billSetup}</p>
                  <p className="crypto-checkout-bill-hint">{copy.billSetupHint}</p>
                </div>
                <span>{setupEur != null ? formatEur(setupEur) : "\u00a0"}</span>
              </li>
              <li>
                <div>
                  <p>{copy.billYear}</p>
                  <p className="crypto-checkout-bill-hint">
                    {copy.billYearHint(monthlyEur != null ? formatEur(monthlyEur) : "—")}
                  </p>
                </div>
                <span>{yearEur != null ? formatEur(yearEur) : "\u00a0"}</span>
              </li>
              <li className="is-total">
                <div>
                  <p>{copy.billTotalEur}</p>
                  <p className="crypto-checkout-bill-hint">{copy.billChargeHint}</p>
                </div>
                <span>{totalEur != null ? formatEur(totalEur) : "\u00a0"}</span>
              </li>
            </ul>
            <p className="crypto-checkout-amount is-review">
              {crypto.quoteLoading && !total
                ? copy.quoteLoading
                : total
                  ? `${total} ${paySymbol}`
                  : "\u00a0"}
            </p>
            <p className="crypto-checkout-prepaid">
              <span>{copy.prepaidLine}</span>
              <EscrowInfo copy={copy} />
            </p>
          </div>

          <Button
            onClick={() => {
              if (!connected) {
                void openPicker();
                return;
              }
              void crypto.initiate(chainId, asset, buyer);
            }}
            loading={loading}
            disabled={loading || !total || totalEur == null || !buyer.name || !buyer.email}
          >
            {loading ? copy.paying : total ? copy.pay(total, paySymbol) : copy.pay("—", paySymbol)}
          </Button>

          <p className="crypto-checkout-recover">
            {copy.recover} <Link to="/crypto/recover">{copy.recoverLink}</Link>
          </p>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
