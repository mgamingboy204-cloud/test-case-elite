"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/authToken";
import { queryKeys } from "@/lib/queryKeys";
import type { SessionUser } from "@/lib/session";

const MIN_SPLASH_MS = 800;

type AuthState = "pending" | "logged-in" | "logged-out";

export default function AppSplashPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const startedAtRef = useRef<number>(Date.now());
  const redirectedRef = useRef(false);
  const [authState, setAuthState] = useState<AuthState>("pending");

  useEffect(() => {
    let cancelled = false;

    const runAuthCheck = async () => {
      const token = getAccessToken();
      if (!token) {
        if (!cancelled) setAuthState("logged-out");
        return;
      }

      try {
        const me = await apiFetch<SessionUser>("/me", { retryOnUnauthorized: false });
        queryClient.setQueryData(queryKeys.me, me);
        if (!cancelled) setAuthState("logged-in");
      } catch {
        if (!cancelled) setAuthState("logged-out");
      }
    };

    void runAuthCheck();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  useEffect(() => {
    if (authState === "pending" || redirectedRef.current) return;

    redirectedRef.current = true;
    const elapsed = Date.now() - startedAtRef.current;
    const waitMs = Math.max(0, MIN_SPLASH_MS - elapsed);
    const nextPath = authState === "logged-in" ? "/pwa_app/home" : "/pwa_app/get-started";

    void router.prefetch(nextPath);

    const timer = window.setTimeout(() => {
      router.replace(nextPath);
    }, waitMs);

    return () => window.clearTimeout(timer);
  }, [authState, router]);

  return (
    <>
      <div className="app-splash-shell" aria-label="Elite Match splash screen">
        <div className="app-splash-brand">
          <div className="app-splash-logo" aria-hidden="true">
            <Image src="/icons/icon-192.png" alt="" width={80} height={80} priority />
          </div>
          <div className="app-splash-title">Elite Match</div>
        </div>
        <p className="app-splash-credit">from Elite Tech</p>
      </div>
      <style jsx>{`
        .app-splash-shell {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          overflow: hidden;
          display: grid;
          grid-template-rows: 1fr auto;
          align-items: stretch;
          justify-items: center;
          padding: calc(24px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) calc(16px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px));
          background: radial-gradient(120% 80% at 80% 10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 62%),
            linear-gradient(180deg, color-mix(in srgb, var(--bg) 96%, transparent), color-mix(in srgb, var(--bg2) 88%, var(--accent) 12%));
          animation: splashFade 240ms ease-out;
        }

        [data-theme="light"] .app-splash-shell {
          background: radial-gradient(120% 86% at 85% 0%, color-mix(in srgb, var(--accent2) 12%, transparent), transparent 60%),
            linear-gradient(180deg, color-mix(in srgb, var(--surface) 88%, white 12%), color-mix(in srgb, var(--bg) 94%, var(--accent2) 6%));
        }

        .app-splash-brand {
          align-self: center;
          transform: translateY(-8vh);
          display: grid;
          justify-items: center;
          gap: 14px;
        }

        .app-splash-logo {
          width: 84px;
          height: 84px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 48px color-mix(in srgb, var(--accent) 20%, transparent);
        }

        .app-splash-title {
          font-size: 1.75rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--text);
        }

        .app-splash-credit {
          margin: 0;
          align-self: end;
          font-size: 14px;
          font-weight: 500;
          color: color-mix(in srgb, var(--text) 55%, transparent);
          text-align: center;
        }

        @keyframes splashFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
