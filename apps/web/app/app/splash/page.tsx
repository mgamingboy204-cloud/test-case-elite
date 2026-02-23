"use client";

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
    const nextPath = authState === "logged-in" ? "/app/home" : "/app/get-started";

    const timer = window.setTimeout(() => {
      router.replace(nextPath);
    }, waitMs);

    return () => window.clearTimeout(timer);
  }, [authState, router]);

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
          background: radial-gradient(140% 120% at 0% 0%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 58%),
            linear-gradient(180deg, color-mix(in srgb, var(--bg) 96%, black 4%), var(--bg));
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
