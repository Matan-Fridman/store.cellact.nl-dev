import { Button } from "../../components/Button";
import { StepProgress } from "../../components/StepProgress";
import { ErrorAlert } from "../../components/ErrorAlert";
import { ClaimResult } from "./ClaimResult";
import { useClaim } from "../../hooks/useClaim";
import { formatPhone } from "../../utils/format";
import type { ClaimParams } from "../../types";

const STEPS = [
  { label: "Verifying your purchase" },
  { label: "Preparing your number" },
  { label: "Activating your number" },
];

const STEP_MESSAGES = [
  "Verifying purchase...",
  "Preparing number...",
  "Activating...",
];

interface ClaimCardProps {
  params: ClaimParams;
}

export function ClaimCard({ params }: ClaimCardProps) {
  const { status, step, data, error, claim, reset } = useClaim();

  const handleClaim = () => {
    claim(params.secret, params.label, params.walletAddress);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl mb-5">
        📱
      </div>

      <h1 className="text-2xl font-bold text-slate-900">
        Activate Your Number
      </h1>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed">
        Complete the activation to start using your secondary number. This will
        only take a moment.
      </p>

      <div className="mt-6 space-y-0 divide-y divide-slate-100">
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Number
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {formatPhone(params.label)}
          </span>
        </div>
      </div>

      <div className="my-6 h-px bg-slate-100" />

      <StepProgress steps={STEPS} currentStep={step} />

      <div className="mt-6">
        {status === "success" ? (
          <Button variant="success" disabled>
            Activated Successfully
          </Button>
        ) : (
          <Button
            onClick={handleClaim}
            loading={status === "loading"}
            disabled={status === "loading"}
          >
            {status === "loading"
              ? STEP_MESSAGES[Math.min(step - 1, 2)]
              : status === "error"
                ? "Retry"
                : "Activate Number"}
          </Button>
        )}
      </div>

      {data && <ClaimResult data={data} />}

      <ErrorAlert message={error} onDismiss={reset} />
    </div>
  );
}
