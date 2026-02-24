"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { resolveNextRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import styles from "./get-started.module.css";

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1440&q=80",
] as const;

export default function AppGetStartedPage() {
  const router = useRouter();
  const { status, user } = useSession();

  const backgroundImage = useMemo(() => {
    const imageIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    return BACKGROUND_IMAGES[imageIndex] ?? BACKGROUND_IMAGES[0];
  }, []);

  useLayoutEffect(() => {
    document.body.classList.add("app-entry-no-scroll");
    return () => document.body.classList.remove("app-entry-no-scroll");
  }, []);

  useEffect(() => {
    if (status !== "logged-in") return;
    router.replace(resolveNextRoute(user, { loggedOutRoute: "/pwa_app/get-started" }));
  }, [status, user, router]);

  useEffect(() => {
    void router.prefetch("/login");
    void router.prefetch("/signup");
  }, [router]);

  return (
    <main className={styles.shell} aria-label="Get started">
      <img className={styles.getStartedBg} src={backgroundImage} alt="" aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />

      <header className={styles.top}>Elite Match</header>

      {/* Dock wrapper fixes iOS safe-area + removes “dead zone” */}
      <section className={styles.bottom} aria-label="Get started actions">
        <h1>Start something epic.</h1>
        <p className={styles.sub}>Private. Curated. Exceptional.</p>

        <div className={styles.actions}>
          <Link className={`${styles.actionBtn} ${styles.primary}`} href="/signup">
            Create account
          </Link>
          <Link className={`${styles.actionBtn} ${styles.secondary}`} href="/login">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
