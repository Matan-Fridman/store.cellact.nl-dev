import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { PurchaseModal } from "./store/SecretModal";
import { usePurchase } from "../hooks/usePurchase";

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { status, data, error, completePurchase, reset } = usePurchase();
  const calledRef = useRef(false);
  /** QR / Arnacon setup only after the user taps the button (not automatically). */
  const [showSetupModal, setShowSetupModal] = useState(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }
    if (calledRef.current) return;
    calledRef.current = true;
    completePurchase(sessionId);
  }, [sessionId, completePurchase, navigate]);

  const handleCloseModal = () => {
    setShowSetupModal(false);
    reset();
    navigate("/", { replace: true });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-lg">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-6 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
              <span
                className="inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-blue-400 border-t-transparent"
                aria-label="Loading"
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">
                Payment received
              </p>
              <p className="mt-1.5 text-sm text-slate-400">
                We’re preparing your number. This usually takes a few seconds…
              </p>
            </div>
          </div>
        )}

        {status === "success" && data && !showSetupModal && (
          <div className="flex flex-col items-center gap-8 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl">
              ✓
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Payment successful
              </h1>
              <p className="mt-3 text-slate-500 leading-relaxed text-sm max-w-sm mx-auto">
                Your payment went through. When you’re ready, open the next step
                to scan the QR code in the Arnacon app and activate your Israeli
                number.
              </p>
            </div>
            <Button
              onClick={() => setShowSetupModal(true)}
              className="max-w-xs"
            >
              Show QR & activate number
            </Button>
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              Back to store
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-6 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
              ⚠️
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">
                Something went wrong
              </p>
              <p className="mt-1.5 text-sm text-slate-400 max-w-sm">{error}</p>
            </div>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Back to Store
            </button>
          </div>
        )}
      </div>

      {data && (
        <PurchaseModal
          open={status === "success" && showSetupModal}
          onClose={handleCloseModal}
          data={data}
        />
      )}
    </Layout>
  );
}
