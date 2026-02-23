"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isStandaloneDisplayMode } from "@/lib/displayMode";

export default function AppGatewayPage() {
  const router = useRouter();

  useEffect(() => {
    if (isStandaloneDisplayMode()) {
      router.replace("/app/splash");
      return;
    }
    router.replace("/discover");
  }, [router]);

  return null;
}
