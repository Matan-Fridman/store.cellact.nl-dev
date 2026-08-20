import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { useLanguage } from "../contexts/LanguageContext";
import {
  CRYPTO_ESCROW,
  escrowExplorerUrl,
  quoteMonthly,
  shortHex,
  useCryptoPurchase,
  type CryptoAsset,
  type CryptoChainId,
} from "../hooks/useCryptoPurchase";

const ESCROW_CANCEL_CODE = `function cancel(bytes32 orderId) external whenNotPaused nonReentrant {
    Subscription storage sub = subscriptions[orderId];
    if (msg.sender != sub.payer) revert NotPayer();
    // cancelEffective = end of current 30-day period
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

function EscrowContract({
  chainId,
  copy,
}: {
  chainId: CryptoChainId;
  copy: {
    contractLabel: string;
    copyAddress: string;
    copied: string;
    amoy: string;
    sepolia: string;
    whySameAddress: string;
  };
}) {
  const [copied, setCopied] = useState(false);
  const address = CRYPTO_ESCROW[chainId];

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="crypto-checkout-contract">
      <p className="crypto-checkout-contract-label">{copy.contractLabel}</p>
      <p className="crypto-checkout-contract-addr" dir="ltr">
        {shortHex(address)}
      </p>
      <p className="crypto-checkout-contract-addr is-full" dir="ltr">
        {address}
      </p>
      <div className="crypto-checkout-contract-actions">
        <button type="button" onClick={() => void copyAddress()}>
          {copied ? copy.copied : copy.copyAddress}
        </button>
        <a href={escrowExplorerUrl(80002)} target="_blank" rel="noreferrer">
          {copy.amoy}
        </a>
        <a href={escrowExplorerUrl(11155111)} target="_blank" rel="noreferrer">
          {copy.sepolia}
        </a>
      </div>
      <p className="crypto-checkout-contract-note">{copy.whySameAddress}</p>
    </div>
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

  useEffect(() => {
    if (isWhy) return;
    void crypto.loadQuote(chainId, asset).catch(() => undefined);
  }, [chainId, asset, crypto.loadQuote, isWhy]);

  if (isWhy) {
    return (
      <Layout hideAppStoreBadges>
        <section className="crypto-explain-page">
          <div className="crypto-checkout-frame is-doc">
            <p className="crypto-checkout-back">
              <Link to="/crypto">{copy.whyBack}</Link>
            </p>
            <p className="crypto-checkout-kicker">{copy.kicker}</p>
            <h1>{copy.whyTitle}</h1>
            <p className="crypto-checkout-lead">{copy.whyLead}</p>
            <article className="crypto-why">
              <h2>{copy.whyRefuseTitle}</h2>
              <p>{copy.whyRefuse}</p>
              <h2>{copy.whyLockTitle}</h2>
              <p>{copy.whyLock}</p>
              <h2>{copy.whyCancelTitle}</h2>
              <p>{copy.whyCancelBody}</p>
              <h2>{copy.whyTrustTitle}</h2>
              <p>{copy.whyTrust}</p>
              <h2>{copy.whyContractTitle}</h2>
              <EscrowContract chainId={chainId} copy={copy} />
              <h2>{copy.whyCodeTitle}</h2>
              <p>{copy.whyCodeLead}</p>
              <pre dir="ltr">
                <code>{ESCROW_CANCEL_CODE}</code>
              </pre>
            </article>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout hideAppStoreBadges>
      <section className="crypto-checkout">
        <div className="crypto-checkout-frame">
          <p className="crypto-checkout-back">
            <Link to="/">{copy.back}</Link>
          </p>
          <h1>{copy.title}</h1>

          <p className="crypto-checkout-amount">
            {crypto.quoteLoading && !monthly
              ? copy.quoteLoading
              : monthly
                ? copy.perMonth(monthly.monthly, paySymbol)
                : "\u00a0"}
          </p>
          {monthly?.intro && (
            <p className="crypto-checkout-review-meta">
              {copy.introMonths(monthly.intro, paySymbol, monthly.introCount)}
            </p>
          )}

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
              ) : (
                copy.walletOff
              )}
            </p>
            {!connected && (
              <button
                type="button"
                className="crypto-checkout-wallet-action"
                onClick={() => void crypto.connect()}
                disabled={crypto.connecting || loading}
              >
                {crypto.connecting ? copy.connecting : copy.connect}
              </button>
            )}
          </div>

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

          {crypto.error && (
            <button type="button" className="crypto-checkout-error" onClick={crypto.reset}>
              {crypto.error === "expired_quote"
                ? copy.expiredQuote
                : crypto.error === "rpc_busy"
                  ? copy.rpcBusy
                  : crypto.error}
            </button>
          )}

          <Button
            onClick={() => void crypto.initiate(chainId, asset)}
            loading={loading}
            disabled={loading || !monthly}
          >
            {loading ? copy.paying : copy.pay(paySymbol)}
          </Button>

          <p className="crypto-checkout-recover">
            {copy.recover} <Link to="/crypto/recover">{copy.recoverLink}</Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
