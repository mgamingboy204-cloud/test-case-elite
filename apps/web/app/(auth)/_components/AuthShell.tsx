"use client";

import { useTheme } from "@/app/providers";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import styles from "./AuthShell.module.css";

export function AuthShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();

  useEffect(() => {
    document.body.classList.add("app-entry-no-scroll");
    return () => {
      document.body.classList.remove("app-entry-no-scroll");
    };
  }, []);

  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={`${styles.glow} ${styles.glowTop}`} aria-hidden="true" />
      <div className={`${styles.glow} ${styles.glowBottom}`} aria-hidden="true" />

      <header className={styles.topRow}>
        <Link href="/" className={styles.brand}>
          Elite Match
        </Link>
        <button type="button" onClick={toggle} className={styles.themeButton} aria-label="Toggle theme">
          {theme === "light" ? "☾" : "☀"}
        </button>
      </header>

      <main className={styles.cardShell}>
        <section className={styles.card}>{children}</section>
      </main>
    </div>
  );
}
