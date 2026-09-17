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
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors"
              style={{
                background: isDone
                  ? "rgba(16,185,129,0.15)"
                  : isActive
                  ? "rgba(142,45,226,0.2)"
                  : "var(--color-bg-raised)",
                color: isDone
                  ? "#059669"
                  : isActive
                  ? "#C45BFF"
                  : "var(--color-text-muted)",
              }}
            >
              {isDone ? "✓" : stepNum}
            </div>
            <span
              className="pt-0.5 text-sm leading-snug transition-colors"
              style={{
                color: isActive
                  ? "var(--color-text)"
                  : "var(--color-text-muted)",
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
