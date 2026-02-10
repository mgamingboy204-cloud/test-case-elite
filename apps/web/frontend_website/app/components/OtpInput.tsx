"use client";

import React from "react"

import { useState, useRef, useCallback, useEffect, type CSSProperties } from "react";

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function OtpInput({ length = 6, onComplete, disabled = false }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, val: string) => {
      if (!/^\d?$/.test(val)) return;
      const next = [...values];
      next[index] = val;
      setValues(next);

      if (val && index < length - 1) {
        refs.current[index + 1]?.focus();
      }

      if (next.every((v) => v !== "")) {
        onComplete(next.join(""));
      }
    },
    [values, length, onComplete]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !values[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    },
    [values]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      const next = [...values];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setValues(next);
      if (next.every((v) => v !== "")) {
        onComplete(next.join(""));
      }
    },
    [values, length, onComplete]
  );

  const cellStyle: CSSProperties = {
    width: 48,
    height: 56,
    textAlign: "center",
    fontSize: 22,
    fontWeight: 700,
    borderRadius: "var(--radius-md)",
    border: "2px solid var(--border)",
    background: "var(--panel)",
    color: "var(--text)",
    outline: "none",
    transition: "border-color 200ms ease",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
      }}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={values[i]}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          style={cellStyle}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

/* Resend Timer */
interface ResendTimerProps {
  onResend: () => void;
  seconds?: number;
}

export function ResendTimer({ onResend, seconds = 60 }: ResendTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  if (remaining > 0) {
    return (
      <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>
        Resend code in {remaining}s
      </p>
    );
  }

  return (
    <button
      onClick={() => {
        setRemaining(seconds);
        onResend();
      }}
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: "var(--primary)",
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "block",
        margin: "0 auto",
      }}
    >
      Resend Code
    </button>
  );
}
