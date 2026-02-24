"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import SplashScreen from "@/app/components/SplashScreen";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/authToken";
import { queryKeys } from "@/lib/queryKeys";
import type { SessionUser } from "@/lib/session";

const MIN_SPLASH_MS = 800;

type AuthState = "pending" | "logged-in" | "logged-out";

export default function AppGatewayPage() {
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
    const nextPath = authState === "logged-in" ? "/pwa_app/discover" : "/pwa_app/get-started";

    void router.prefetch(nextPath);

    window.setTimeout(() => {
      router.replace(nextPath);
    }, waitMs);
  }, [authState, router]);

  return <SplashScreen />;
}
