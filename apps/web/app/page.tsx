"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import SplashScreen from "./components/SplashScreen";

const MIN_SPLASH_MS = 420;

function isStandalone() {
  if (typeof window === "undefined") return false;
  const iosStandalone = "standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export default function RootEntryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (pathname !== "/" || redirectedRef.current) return;

    redirectedRef.current = true;
    const destination = isStandalone() ? "/pwa_app" : "/marketing";
    const elapsed = Date.now() - startedAtRef.current;
    const waitMs = Math.max(0, MIN_SPLASH_MS - elapsed);

    void router.prefetch(destination);

    window.setTimeout(() => {
      router.replace(destination);
    }, waitMs);
  }, [pathname, router]);

  return <SplashScreen subtitle="A premium introduction service" />;
}
