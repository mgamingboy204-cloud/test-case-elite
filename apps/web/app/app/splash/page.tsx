"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

const MIN_SPLASH_MS = 800;

export default function AppSplashPage() {
  const router = useRouter();
  const { status } = useSession();
  const startedAtRef = useRef<number | null>(null);
  const redirectedRef = useRef(false);
  const prefetchedRef = useRef(false);

  useEffect(() => {
    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    router.prefetch("/app/get-started");
    router.prefetch("/app/home");
  }, [router]);

  useEffect(() => {
    if (redirectedRef.current || status === "loading") return;

    redirectedRef.current = true;
    const elapsed = Date.now() - (startedAtRef.current ?? Date.now());
    const waitMs = Math.max(0, MIN_SPLASH_MS - elapsed);
    const nextPath = status === "logged-in" ? "/app/home" : "/app/get-started";

    const timer = window.setTimeout(() => {
      router.replace(nextPath);
    }, waitMs);

    return () => window.clearTimeout(timer);
  }, [router, status]);

  return (
    <>
      <div className="app-splash-shell" aria-label="Elite Match splash screen">
        <div className="app-splash-brand">
          <div className="app-splash-logo" aria-hidden="true">EM</div>
          <div className="app-splash-title">Elite Match</div>
        </div>
      </div>
      <style jsx>{`
        .app-splash-shell {
          min-height: 100vh;
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: calc(20px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) calc(20px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px));
          background: radial-gradient(160% 120% at 0% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 58%),
            linear-gradient(160deg, var(--bg), color-mix(in srgb, var(--surface2) 88%, black 12%));
          background-color: var(--bg);
        }

        .app-splash-brand {
          display: grid;
          justify-items: center;
          gap: 14px;
        }

        .app-splash-logo {
          width: 80px;
          height: 80px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: white;
          background: linear-gradient(145deg, var(--accent), color-mix(in srgb, var(--accent-deep) 80%, black 20%));
          box-shadow: 0 20px 48px color-mix(in srgb, var(--accent) 30%, transparent);
        }

        .app-splash-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: var(--text);
        }
      `}</style>
    </>
  );
}
