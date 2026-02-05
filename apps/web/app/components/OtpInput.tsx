"use client";

import type { ClipboardEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
  idPrefix?: string;
};

export default function OtpInput({ value, onChange, disabled = false, length = 6, idPrefix = "otp" }: Props) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => {
    const sanitized = value.replace(/\D/g, "").slice(0, length);
    const result = Array.from({ length }).map((_, index) => sanitized[index] ?? "");
    return result;
  }, [value, length]);

  useEffect(() => {
    if (!value) {
      inputRefs.current[0]?.focus();
    }
  }, [value]);

  function updateValue(next: string) {
    onChange(next.replace(/\D/g, "").slice(0, length));
  }

  function handleChange(index: number, nextValue: string) {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    updateValue(nextDigits.join(""));
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      updateValue(pasted);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  }

  return (
    <div className="otp-input" role="group" aria-label="One-time password">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={index === 0 ? idPrefix : `${idPrefix}-${index}`}
          value={digit}
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
