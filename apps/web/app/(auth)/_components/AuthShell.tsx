"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useTheme } from "@/app/providers";
import styles from "./AuthShell.module.css";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className={styles.root}>
      <div className={styles.background} aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <header className={styles.topBar}>
        <Link href="/" className={styles.brand}>
          Elite Match
        </Link>
        <button onClick={toggle} className={styles.themeButton} aria-label="Toggle theme">
          {theme === "light" ? "☾" : "☀"}
        </button>
      </header>

      <main className={styles.sheet}>{children}</main>
    </div>
  );
}
