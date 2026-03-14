"use client";

import React, { useRef, useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export function OTPInput({ length = 6, onComplete }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Allow pasting
    if (value.length > 1) {
      const pastedData = value.slice(0, length).split("");
      for (let i = 0; i < length; i++) {
        newOtp[i] = pastedData[i] || "";
      }
      setOtp(newOtp);
      // focus last filled
      const lastFilledIndex = newOtp.findLastIndex(val => val !== "");
      const focusIndex = lastFilledIndex < length - 1 ? lastFilledIndex + 1 : length - 1;
      inputRefs.current[focusIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-advance
      if (value !== "" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    if (newOtp.every(v => v !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2 max-w-sm mx-auto w-full">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className={cn(
            "w-12 h-16 text-center text-3xl font-light bg-transparent border-b transition-all duration-500 focus:outline-none",
            digit 
              ? "border-[#C89B90] text-white" 
              : "border-[#C89B90]/20 text-white/20 focus:border-[#C89B90]"
          )}
        />
      ))}
    </div>
  );
}
