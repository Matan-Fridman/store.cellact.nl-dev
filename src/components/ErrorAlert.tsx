interface ErrorAlertProps {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className="mt-4 rounded-xl px-4 py-3 text-sm"
      style={{
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.3)",
        color: "#f87171",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
