"use client";

import React from "react"

import Link from "next/link";
import { useTheme } from "@/app/providers";
import RouteGuard from "@/app/components/RouteGuard";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          height: 56,
          borderBottom: "1px solid var(--border)",
          background: "var(--panel)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
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
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "32px 24px 80px",
        }}
      >
        <RouteGuard allowedOnboardingSteps={["PHONE_VERIFIED", "VIDEO_VERIFICATION_PENDING", "VIDEO_VERIFIED", "PAYMENT_PENDING", "PAID", "PROFILE_PENDING"]}>{children}</RouteGuard>
      </main>
    </div>
  );
}
