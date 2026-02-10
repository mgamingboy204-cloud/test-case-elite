"use client";

import React from "react"

import Link from "next/link";
import { useTheme } from "@/app/providers";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 24,
      }}
    >
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button
          onClick={toggle}
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            border: "1px solid var(--border)",
            background: "var(--panel)",
            color: "var(--text)",
          }}
          aria-label="Toggle theme"
        >
          {theme === "light" ? "\u263E" : "\u2600"}
        </button>
      </div>
      <Link
        href="/"
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "var(--primary)",
          marginBottom: 32,
          letterSpacing: "-0.02em",
        }}
      >
        Elite Match
      </Link>
      {children}
    </div>
  );
}
