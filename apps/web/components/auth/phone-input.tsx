"use client";

import React from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center border-b border-[#C89B90]/30 focus-within:border-[#C89B90] transition-all duration-500 group">
        <span className="text-lg text-[#C89B90] pr-3 font-medium">+91</span>
        <input
          type="tel"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            onChange(val);
          }}
          placeholder="00000 00000"
          className="flex-1 bg-transparent py-4 text-xl tracking-widest text-white placeholder:text-white/10 outline-none"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
