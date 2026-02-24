"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./get-started.module.css";

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1440&q=80"
] as const;

export default function AppGetStartedPage() {
  const router = useRouter();
  const backgroundImage = useMemo(() => {
    const imageIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    return BACKGROUND_IMAGES[imageIndex] ?? BACKGROUND_IMAGES[0];
  }, []);

  useLayoutEffect(() => {
    document.body.classList.add("app-entry-no-scroll");

    return () => {
      document.body.classList.remove("app-entry-no-scroll");
    };
  }, []);

  useEffect(() => {
    void router.prefetch("/app/login");
    void router.prefetch("/app/signup/phone");
  }, [router]);

  return (
    <main className={`${styles.shell} entry-screen`} aria-label="Get started">
      <img className={styles.getStartedBg} src={backgroundImage} alt="" aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />

      <header className={styles.top}>Elite Match</header>

      <section className={styles.bottom} aria-label="Get started actions">
        <h1>Start something epic.</h1>
        <p className={styles.sub}>Private. Curated. Exceptional.</p>

        <div className={styles.actions}>
          <Link className={`${styles.actionBtn} ${styles.primary}`} href="/app/signup/phone">
            Create account
          </Link>
          <Link className={`${styles.actionBtn} ${styles.secondary}`} href="/app/login">
            I have an account
          </Link>
        </div>

        <p className={styles.termsText}>By continuing, you agree to our Terms &amp; Privacy Policy.</p>
      </section>
    </main>
  );
}
