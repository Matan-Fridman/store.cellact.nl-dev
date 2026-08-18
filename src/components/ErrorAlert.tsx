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
        background: "rgba(185,28,28,0.08)",
        border: "1px solid rgba(185,28,28,0.22)",
        color: "#b91c1c",
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
