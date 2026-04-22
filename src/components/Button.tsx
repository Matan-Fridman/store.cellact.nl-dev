import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success";
  loading?: boolean;
  /** Default true — set false for inline/auto-width buttons */
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClass: Record<string, string> = {
  primary:   "btn-primary",
  secondary: "btn-secondary",
  success:   "btn-success",
};

export function Button({
  variant = "primary",
  loading = false,
  fullWidth = true,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        ${fullWidth ? "w-full" : "w-auto"}
        rounded-xl px-6 py-3.5 text-sm font-semibold
        disabled:opacity-40 disabled:!cursor-not-allowed
        ${variantClass[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      role="status"
      aria-label="Loading"
    />
  );
}
