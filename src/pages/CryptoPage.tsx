import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { useLanguage } from "../contexts/LanguageContext";
import {
  formatLockAmount,
  useCryptoPurchase,
  type CryptoAsset,
  type CryptoChainId,
} from "../hooks/useCryptoPurchase";

export function CryptoPage() {
  const { t } = useLanguage();
  const copy = t.crypto;
  const crypto = useCryptoPurchase();
  const [chainId, setChainId] = useState<CryptoChainId>(80002);
  const [asset, setAsset] = useState<CryptoAsset>("usdc");
  const [view, setView] = useState<"setup" | "review">("setup");
  const loading = crypto.status === "loading";
  const connected = Boolean(crypto.account);
  const nativeSymbol = chainId === 80002 ? "POL" : "ETH";
  const paySymbol = asset === "usdc" ? copy.usdc : nativeSymbol;
  const expectedSymbol = asset === "usdc" ? "USDC" : nativeSymbol;
  const lockAmount =
    crypto.quote && crypto.quote.chainId === chainId && crypto.quote.tokenSymbol === expectedSymbol
      ? formatLockAmount(crypto.quote.totalAmount, crypto.quote.tokenSymbol)
      : null;
  const reviewing = view === "review";
  const stepChooseClass = reviewing || loading ? "is-done" : "is-current";
  const stepReviewClass = loading ? "is-done" : reviewing ? "is-current" : "";
  const stepPayClass = loading ? "is-current" : "";

  useEffect(() => {
    void crypto.loadQuote(chainId, asset).catch(() => undefined);
  }, [chainId, asset, crypto.loadQuote]);

  function openReview() {
    if (!lockAmount) return;
    setView("review");
  }

  return (
    <Layout hideAppStoreBadges>
      <section className="crypto-checkout">
        <div className="crypto-checkout-frame">
          <p className="crypto-checkout-back">
            {reviewing ? (
              <button type="button" onClick={() => setView("setup")}>
                {copy.changeSelection}
              </button>
            ) : (
              <Link to="/">{copy.back}</Link>
            )}
          </p>
          <p className="crypto-checkout-kicker">{copy.kicker}</p>
          <h1>{reviewing ? copy.reviewTitle : copy.title}</h1>
          <p className="crypto-checkout-lead">{reviewing ? copy.reviewLead : copy.lead}</p>

          <ol className="crypto-checkout-steps" aria-label={`${copy.stepChoose}, ${copy.stepReview}, ${copy.stepPay}`}>
            <li className={stepChooseClass}>{copy.stepChoose}</li>
            <li className={stepReviewClass}>{copy.stepReview}</li>
            <li className={stepPayClass}>{copy.stepPay}</li>
          </ol>

          {reviewing ? (
            <>
              <p className="crypto-checkout-amount is-review">
                {lockAmount ? copy.lock(lockAmount, paySymbol) : copy.quoteLoading}
              </p>
              <p className="crypto-checkout-review-meta">
                {chainId === 80002 ? copy.amoy : copy.sepolia}
                {connected && crypto.accountShort ? ` · ${crypto.accountShort}` : ""}
              </p>
              <ul className="crypto-checkout-how">
                <li>{copy.reviewEscrow}</li>
                <li>{copy.reviewTerm}</li>
                <li>{asset === "usdc" ? copy.reviewFxUsdc : copy.reviewFxNative}</li>
                <li>{copy.reviewAfter}</li>
                <li>{copy.reviewClaim}</li>
              </ul>
            </>
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

              <p className="crypto-checkout-amount">
                {crypto.quoteLoading && !lockAmount
                  ? copy.quoteLoading
                  : lockAmount
                    ? copy.lock(lockAmount, paySymbol)
                    : "\u00a0"}
              </p>
            </>
          )}

          {crypto.error && (
            <button type="button" className="crypto-checkout-error" onClick={crypto.reset}>
              {crypto.error}
            </button>
          )}

          {reviewing ? (
            <Button
              onClick={() => void crypto.initiate(chainId, asset)}
              loading={loading}
              disabled={loading || !lockAmount}
            >
              {loading ? copy.paying : copy.pay(paySymbol)}
            </Button>
          ) : (
            <Button
              onClick={openReview}
              disabled={!lockAmount || crypto.quoteLoading}
            >
              {copy.continue}
            </Button>
          )}

          <p className="crypto-checkout-recover">
            {copy.recover} <Link to="/crypto/recover">{copy.recoverLink}</Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
