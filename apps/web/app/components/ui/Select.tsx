"use client";

import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, style, className, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={className} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 15,
            borderRadius: "var(--radius-md)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            background: "var(--panel)",
            color: "var(--text)",
            outline: "none",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E8E9A' strokeWidth='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
            paddingRight: 40,
            ...style,
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <span style={{ fontSize: 13, color: "var(--danger)" }}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
