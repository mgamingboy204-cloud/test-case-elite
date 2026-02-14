"use client";

import React from "react";
import Link from "next/link";
import { PremiumBadge } from "@/app/components/premium/PremiumBadge";
import { PremiumShell } from "@/app/components/premium/PremiumShell";
import { useTheme } from "@/app/providers";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <PremiumShell variant="auth">
      <div className="auth-layout">
        <div className="auth-layout__top">
          <Link href="/" className="auth-logo">
            Elite Match
          </Link>
          <PremiumBadge>Private • Verified • Discreet</PremiumBadge>
          <button type="button" onClick={toggle} className="theme-toggle" aria-label="Toggle theme">
            {theme === "light" ? "☾" : "☀"}
          </button>
        </div>
        <div className="auth-layout__content">{children}</div>
      </div>
    </PremiumShell>
  );
}
