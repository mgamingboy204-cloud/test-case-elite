"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "./components/SplashScreen";
import { isStandaloneDisplayMode } from "@/lib/displayMode";
import { useSession } from "@/lib/session";
import {
  getSplashFallbackRoute,
  resolveSplashDestination,
  SPLASH_MIN_VISIBLE_MS,
  SPLASH_SOFT_TIMEOUT_MS,
  warmRouteChunks
} from "@/lib/splashGate";

export default function RootEntryPage() {
  const router = useRouter();
  const { status, user } = useSession();
  const startedAtRef = useRef(Date.now());
  const redirectedRef = useRef(false);
  const isPwaRef = useRef(false);

  useEffect(() => {
    isPwaRef.current = isStandaloneDisplayMode();
    const fallback = getSplashFallbackRoute(isPwaRef.current);

    void router.prefetch(fallback);
    warmRouteChunks(fallback);

    const softTimeout = window.setTimeout(() => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      if (process.env.NODE_ENV !== "production") {
        console.debug("[splash-gate] soft-timeout route", { fallback });
      }
      document.body.classList.add("splash-transition");
      router.replace(fallback);
    }, SPLASH_SOFT_TIMEOUT_MS);

    return () => {
      window.clearTimeout(softTimeout);
    };
  }, [router]);

  useEffect(() => {
    if (redirectedRef.current || status === "loading") return;

    const destination = resolveSplashDestination(status, user, isPwaRef.current);
    const elapsed = Date.now() - startedAtRef.current;
    const waitMs = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);

    void router.prefetch(destination);
    warmRouteChunks(destination);

    const redirectTimer = window.setTimeout(() => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      document.body.classList.add("splash-transition");
      router.replace(destination);
    }, waitMs);

    return () => window.clearTimeout(redirectTimer);
  }, [router, status, user]);

  return <SplashScreen subtitle="A premium introduction service" />;
}
