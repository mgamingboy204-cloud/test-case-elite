"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

function nextIndex(curr: number, len: number) {
  if (len <= 1) return 0;
  let n = curr;
  while (n === curr) n = Math.floor(Math.random() * len);
  return n;
}

export default function AppGetStartedPage() {
  const router = useRouter();
  const { status, user } = useSession();

  const initialIndex = useMemo(
    () => Math.floor(Math.random() * BACKGROUND_IMAGES.length),
    []
  );

  const [frontIdx, setFrontIdx] = useState(initialIndex);
  const [backIdx, setBackIdx] = useState(() =>
    nextIndex(initialIndex, BACKGROUND_IMAGES.length)
  );
  const [fadeIn, setFadeIn] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

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

  // Preload the back image
  useEffect(() => {
    const src = BACKGROUND_IMAGES[backIdx];
    if (!src) return;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }, [backIdx]);

  // Crossfade loop
  useEffect(() => {
    const DURATION_MS = 1800; // MUST match CSS transition duration
    const HOLD_MS = 4000;     // how long each image stays before next fade

    const tick = () => {
      setFadeIn(true);

      timeoutRef.current = window.setTimeout(() => {
        setFrontIdx(() => {
          const newFront = backIdx;
          const newBack = nextIndex(newFront, BACKGROUND_IMAGES.length);
          setBackIdx(newBack);
          return newFront;
        });
        setFadeIn(false);
      }, DURATION_MS);
    };

    intervalRef.current = window.setInterval(tick, HOLD_MS);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [backIdx]);

  const frontSrc = BACKGROUND_IMAGES[frontIdx] ?? BACKGROUND_IMAGES[0];
  const backSrc = BACKGROUND_IMAGES[backIdx] ?? BACKGROUND_IMAGES[0];

  return (
    <main className={styles.shell} aria-label="Get started">
      {/* Two-layer background for crossfade */}
      <img
        className={`${styles.getStartedBg} ${styles.bgA}`}
        src={frontSrc}
        alt=""
        aria-hidden="true"
      />
      <img
        className={`${styles.getStartedBg} ${styles.bgB} ${fadeIn ? styles.bgBVisible : ""}`}
        src={backSrc}
        alt=""
        aria-hidden="true"
      />

      <div className={styles.overlay} aria-hidden="true" />

      <header className={styles.top}>Elite Match</header>

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
