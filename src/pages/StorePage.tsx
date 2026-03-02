import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import { PurchaseModal } from "./store/SecretModal";
import { usePurchase } from "../hooks/usePurchase";

export function StorePage() {
  const { status, data, error, purchase, reset } = usePurchase();

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
                Israeli number assigned on purchase
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <Feature text="Incoming and outgoing calls & SMS" />
            <Feature text="Works with your existing SIM — no dual-SIM needed" />
            <Feature text="Activate instantly via the Arnacon app" />
          </div>

          <div className="border-t border-slate-100 pt-6">
            {status === "success" ? (
              <Button variant="success" disabled>
                Purchased Successfully
              </Button>
            ) : (
              <Button
                onClick={purchase}
                loading={status === "loading"}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Processing..." : "Purchase Number"}
              </Button>
            )}
          </div>

          <ErrorAlert message={error} onDismiss={reset} />
        </div>
      </div>

      {data && (
        <PurchaseModal
          open={status === "success"}
          onClose={reset}
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
