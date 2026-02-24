"use client";

import React from "react"

import Link from "next/link";
import { useTheme } from "@/app/providers";
import RouteGuard from "@/components/shared/RouteGuard";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <header
        className="safe-top safe-x"
        style={{
          minHeight: 56,
          borderBottom: "1px solid var(--border)",
          background: "var(--panel)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}
        >
          Elite Match
        </Link>
        <button
          onClick={toggle}
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            border: "1px solid var(--border)",
            background: "var(--panel)",
            color: "var(--text)",
          }}
          aria-label="Toggle theme"
        >
          {theme === "light" ? "\u263E" : "\u2600"}
        </button>
      </header>
      <main
        className="safe-x safe-bottom"
        style={{
          maxWidth: 600,
          margin: "0 auto",
          paddingTop: 32,
        }}
      >
        <RouteGuard allowedOnboardingSteps={["PHONE_VERIFIED", "VIDEO_VERIFICATION_PENDING", "VIDEO_VERIFIED", "PAYMENT_PENDING", "PAID", "PROFILE_PENDING"]}>{children}</RouteGuard>
      </main>
    </div>
  );
}
