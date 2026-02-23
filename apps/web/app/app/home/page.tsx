"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isStandaloneDisplayMode } from "@/lib/displayMode";

export default function AppNativeHomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!isStandaloneDisplayMode()) {
      router.replace("/discover");
      return;
    }
    router.replace("/app/splash");
  }, [router]);

  return null;
}
