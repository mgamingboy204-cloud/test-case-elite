"use client";

import React from "react"

import Link from "next/link";
import { useTheme } from "@/app/providers";
import RouteGuard from "@/app/components/RouteGuard";
import styles from "./layout.module.css";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <div className={styles.root}>
      <header className={`safe-top safe-x ${styles.header}`}>
        <Link href="/" className={styles.brand}>
          Elite Match
        </Link>
        <button
          onClick={toggle}
          className={styles.themeButton}
          aria-label="Toggle theme"
        >
          {theme === "light" ? "\u263E" : "\u2600"}
        </button>
      </header>
      <main className={`safe-x safe-bottom ${styles.main}`}>
        <RouteGuard allowedOnboardingSteps={["PHONE_VERIFIED", "VIDEO_VERIFICATION_PENDING", "VIDEO_VERIFIED", "PAYMENT_PENDING", "PAID", "PROFILE_PENDING"]}>{children}</RouteGuard>
      </main>
    </div>
  );
}
