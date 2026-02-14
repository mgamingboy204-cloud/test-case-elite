import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  loading?: boolean;
}

export function PremiumButton({
  children,
  variant = "primary",
  fullWidth,
  loading,
  className,
  disabled,
  ...props
}: PremiumButtonProps) {
  return (
    <button
      className={`premium-button premium-button--${variant} ${fullWidth ? "premium-button--full" : ""} ${className ?? ""}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      <span className="premium-button__shine" aria-hidden="true" />
      <span className="premium-button__label">{loading ? "Please wait..." : children}</span>
    </button>
  );
}
