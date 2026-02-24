"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";

export default function AppSplashPage() {
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (pathname !== "/pwa_app/splash" || redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace("/pwa_app");
  }, [pathname, router]);

  return <SplashScreen />;
}
