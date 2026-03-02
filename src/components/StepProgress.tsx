interface Step {
  label: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isActive = currentStep === stepNum;
        const isDone = currentStep > stepNum;

        return (
          <div key={stepNum} className="flex items-start gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                isDone
                  ? "bg-emerald-50 text-emerald-600"
                  : isActive
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {isDone ? "✓" : stepNum}
            </div>
            <span
              className={`pt-0.5 text-sm leading-snug transition-colors ${
                isActive
                  ? "font-medium text-slate-900"
                  : isDone
                    ? "text-slate-500"
                    : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
