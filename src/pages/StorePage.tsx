import { useState } from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import { PurchaseModal } from "./store/SecretModal";
import { usePurchase } from "../hooks/usePurchase";

export function StorePage() {
  const { status, data, error, purchase, reset } = usePurchase();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handlePurchase() {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      setValidationError("Please enter your phone number.");
      return;
    }
    setValidationError(null);
    purchase("+" + trimmed);
  }

  function handleReset() {
    setPhoneNumber("");
    setValidationError(null);
    reset();
  }

  return (
    <Layout>
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Get Your Secondary Number
          </h1>
          <p className="mt-3 text-slate-500 leading-relaxed">
            A second mobile number on your existing device. Receive calls and SMS
            on an Israeli number from anywhere in the world — no extra SIM
            required.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              📱
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">
                Mobile Number
              </div>
              <div className="text-sm text-slate-400">
                Enter your phone number to register
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <Feature text="Incoming and outgoing calls & SMS" />
            <Feature text="Works with your existing SIM — no dual-SIM needed" />
            <Feature text="Activate instantly via the Arnacon app" />
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div>
              <label
                htmlFor="phone-number"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Phone Number
              </label>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition has-[:disabled]:opacity-50">
                <span className="flex items-center pl-4 pr-2 text-sm font-medium text-slate-400 select-none">
                  +
                </span>
                <input
                  id="phone-number"
                  type="tel"
                  placeholder="972501234567"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/^\+/, ""));
                    if (validationError) setValidationError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePurchase()}
                  disabled={status === "loading" || status === "success"}
                  className="min-w-0 flex-1 bg-transparent py-3 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {validationError && (
                <p className="mt-1.5 text-xs text-red-500">{validationError}</p>
              )}
            </div>

            {status === "success" ? (
              <Button variant="success" disabled>
                Purchased Successfully
              </Button>
            ) : (
              <Button
                onClick={handlePurchase}
                loading={status === "loading"}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Processing..." : "Purchase Number"}
              </Button>
            )}
          </div>

          <ErrorAlert message={error} onDismiss={handleReset} />
        </div>
      </div>

      {data && (
        <PurchaseModal
          open={status === "success"}
          onClose={handleReset}
          data={data}
        />
      )}
    </Layout>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  );
}
