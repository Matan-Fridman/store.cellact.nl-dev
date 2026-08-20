import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { useLanguage } from "../contexts/LanguageContext";
import {
  CRYPTO_ESCROW,
  escrowExplorerUrl,
  formatLockAmount,
  quoteMonthly,
  shortHex,
  useCryptoPurchase,
  cryptoErrorCopy,
  discoverWallets,
  type CryptoAsset,
  type CryptoChainId,
  type DiscoveredWallet,
  type WalletKind,
} from "../hooks/useCryptoPurchase";

const CHAINS: CryptoChainId[] = [80002, 11155111];

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
          <button
            key={row.kind}
            type="button"
            className="crypto-wallet-pick-btn"
            disabled={connecting}
            onClick={() => onPick(row.kind)}
          >
            <span>{row.label}</span>
            {!available && <span className="crypto-wallet-pick-hint">{copy.walletNotInstalled}</span>}
          </button>
        );
      })}
    </div>
  );
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
      {CHAINS.map((chainId) => {
        const address = CRYPTO_ESCROW[chainId];
        const name = chainId === 80002 ? copy.amoy : copy.sepolia;
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
          <p className="crypto-article-kicker">{copy.kicker}</p>
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
  const [chainId, setChainId] = useState<CryptoChainId>(80002);
  const [asset, setAsset] = useState<CryptoAsset>("usdc");
  const [picking, setPicking] = useState(false);
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);
  const loading = crypto.status === "loading";
  const connected = Boolean(crypto.account);
  const nativeSymbol = chainId === 80002 ? "POL" : "ETH";
  const paySymbol = asset === "usdc" ? copy.usdc : nativeSymbol;
  const expectedSymbol = asset === "usdc" ? "USDC" : nativeSymbol;
  const quoteReady =
    crypto.quote && crypto.quote.chainId === chainId && crypto.quote.tokenSymbol === expectedSymbol
      ? crypto.quote
      : null;
  const monthly = quoteReady ? quoteMonthly(quoteReady) : null;
  const total = quoteReady ? formatLockAmount(quoteReady.totalAmount, expectedSymbol) : null;

  useEffect(() => {
    if (isWhy) return;
    void crypto.loadQuote(chainId, asset).catch(() => undefined);
  }, [chainId, asset, crypto.loadQuote, isWhy]);

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

  if (isWhy) {
    return <WhyArticle copy={copy} />;
  }

  return (
    <Layout hideAppStoreBadges>
      <section className="crypto-checkout">
        <div className="crypto-checkout-frame">
          <p className="crypto-checkout-back">
            <Link to="/">{copy.back}</Link>
          </p>
          <h1>{copy.title}</h1>

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
            <button
              type="button"
              className="crypto-checkout-error"
              onClick={() => {
                setPickError(null);
                crypto.reset();
              }}
            >
              {pickError || cryptoErrorCopy(copy, crypto.error)}
            </button>
          )}

          <label className="crypto-checkout-label" htmlFor="crypto-network-amoy">
            {copy.network}
          </label>
          <div className="crypto-checkout-seg" role="radiogroup" aria-label={copy.network}>
            <button
              id="crypto-network-amoy"
              type="button"
              aria-pressed={chainId === 80002}
              onClick={() => setChainId(80002)}
            >
              {copy.amoy}
            </button>
            <button
              type="button"
              aria-pressed={chainId === 11155111}
              onClick={() => setChainId(11155111)}
            >
              {copy.sepolia}
            </button>
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
              {copy.usdc}
            </button>
            <button
              type="button"
              aria-pressed={asset === "native"}
              onClick={() => setAsset("native")}
            >
              {nativeSymbol}
            </button>
          </div>

          <div className="crypto-checkout-charge">
            <p className="crypto-checkout-amount is-review">
              {crypto.quoteLoading && !total
                ? copy.quoteLoading
                : total
                  ? `${total} ${paySymbol}`
                  : "\u00a0"}
            </p>
            {monthly && (
              <p className="crypto-checkout-review-meta">
                {copy.perMonth(monthly.monthly, paySymbol)}
              </p>
            )}
            {monthly?.intro && (
              <p className="crypto-checkout-review-meta">
                {copy.introMonths(monthly.intro, paySymbol, monthly.introCount)}
              </p>
            )}
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
              void crypto.initiate(chainId, asset);
            }}
            loading={loading}
            disabled={loading || !total}
          >
            {loading ? copy.paying : total ? copy.pay(total, paySymbol) : copy.pay("—", paySymbol)}
          </Button>

          <p className="crypto-checkout-recover">
            {copy.recover} <Link to="/crypto/recover">{copy.recoverLink}</Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
