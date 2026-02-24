"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";
import { useSession } from "@/lib/session";
import {
  resolveSplashDestination,
  SPLASH_MIN_VISIBLE_MS,
  SPLASH_SOFT_TIMEOUT_MS,
  warmRouteChunks
} from "@/lib/splashGate";

export default function AppGatewayPage() {
  const router = useRouter();
  const { status, user } = useSession();
  const startedAtRef = useRef<number>(Date.now());
  const redirectedRef = useRef(false);

  useEffect(() => {
    const fallback = "/pwa_app/get-started";

    void router.prefetch(fallback);
    warmRouteChunks(fallback);

    const softTimeout = window.setTimeout(() => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      if (process.env.NODE_ENV !== "production") {
        console.debug("[splash-gate] pwa soft-timeout route", { fallback });
      }
      document.body.classList.add("splash-transition");
      router.replace(fallback);
    }, SPLASH_SOFT_TIMEOUT_MS);

    return () => window.clearTimeout(softTimeout);
  }, [router]);

  useEffect(() => {
    if (status === "loading" || redirectedRef.current) return;

    const elapsed = Date.now() - startedAtRef.current;
    const waitMs = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);
    const nextPath = resolveSplashDestination(status, user, true);

    void router.prefetch(nextPath);
    warmRouteChunks(nextPath);

    const redirectTimer = window.setTimeout(() => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      document.body.classList.add("splash-transition");
      router.replace(nextPath);
    }, waitMs);

    return () => window.clearTimeout(redirectTimer);
  }, [status, user, router]);

  return <SplashScreen />;
}
