import type { InputHTMLAttributes } from "react";

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function PremiumInput({ label, id, error, className, ...props }: PremiumInputProps) {
  const resolvedId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={resolvedId} className="premium-input-group">
      <span className="premium-input-group__label">{label}</span>
      <input id={resolvedId} className={`premium-input ${className ?? ""}`.trim()} aria-invalid={Boolean(error)} {...props} />
      {error ? <span className="premium-input-group__error">{error}</span> : null}
    </label>
  );
}
