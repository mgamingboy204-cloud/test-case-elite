"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";
import { resolveNextRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

const MIN_SPLASH_MS = 800;

export default function AppGatewayPage() {
  const router = useRouter();
  const { status, user } = useSession();
  const startedAtRef = useRef<number>(Date.now());
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (status === "loading" || redirectedRef.current) return;

    redirectedRef.current = true;
    const elapsed = Date.now() - startedAtRef.current;
    const waitMs = Math.max(0, MIN_SPLASH_MS - elapsed);
    const nextPath = resolveNextRoute(status === "logged-in" ? user : null, {
      loggedOutRoute: "/pwa_app/get-started"
    });

    void router.prefetch(nextPath);

    window.setTimeout(() => {
      router.replace(nextPath);
    }, waitMs);
  }, [status, user, router]);

  return <SplashScreen />;
}
