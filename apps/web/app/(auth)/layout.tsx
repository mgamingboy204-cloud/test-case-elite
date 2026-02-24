"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/app/providers";
import { isStandaloneDisplayMode } from "@/lib/displayMode";
import AppViewportShell from "@/app/components/AppViewportShell";
import styles from "./layout.module.css";

function DesktopAuthShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <AppViewportShell className={styles.authShell}>
      <div className={styles.authBackdrop} aria-hidden="true" />
      <div className={styles.authOverlay} aria-hidden="true" />
      <div className={styles.authVignette} aria-hidden="true" />
      <div className={`${styles.authGlow} ${styles.authGlowTop}`} aria-hidden="true" />
      <div className={`${styles.authGlow} ${styles.authGlowBottom}`} aria-hidden="true" />

      <header className={styles.topRow}>
        <Link href="/" className={styles.brand}>Elite Match</Link>
        <button onClick={toggle} className={styles.themeButton} aria-label="Toggle theme">
          {theme === "light" ? "☾" : "☀"}
        </button>
      </header>

      <main className={styles.authPanel}>{children}</main>
    </AppViewportShell>
  );
}

function MobileAuthShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  useEffect(() => {
    document.body.classList.add("app-entry-no-scroll");
    return () => {
      document.body.classList.remove("app-entry-no-scroll");
    };
  }, []);

  return (
    <AppViewportShell className={styles.mobileAuthShell}>
      <div className={styles.mobileAuthBackground} aria-hidden="true" />
      <div className={styles.mobileAuthOverlay} aria-hidden="true" />

      <header className={styles.mobileTopRow}>
        <Link href="/" className={styles.brand}>Elite Match</Link>
        <button onClick={toggle} className={styles.themeButton} aria-label="Toggle theme">
          {theme === "light" ? "☾" : "☀"}
        </button>
      </header>

      <main className={styles.mobileAuthSheet}>{children}</main>
    </AppViewportShell>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [useMobileShell, setUseMobileShell] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const applyMode = () => {
      setUseMobileShell(media.matches || isStandaloneDisplayMode());
    };

    applyMode();
    media.addEventListener("change", applyMode);
    window.addEventListener("resize", applyMode);
    return () => {
      media.removeEventListener("change", applyMode);
      window.removeEventListener("resize", applyMode);
    };
  }, []);

  return (
    <>
      {useMobileShell ? <MobileAuthShell>{children}</MobileAuthShell> : <DesktopAuthShell>{children}</DesktopAuthShell>}

    </>
  );
}
