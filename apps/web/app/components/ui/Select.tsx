"use client";

import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, style, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
            background: "color-mix(in srgb, var(--surface2) 88%, var(--pearl-panel))",
            color: "var(--text)",
            outline: "none",
            appearance: "none",
            paddingRight: 16,
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
