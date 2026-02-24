"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";

export default function DeprecatedPwaSignupPhone() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signup?pwa=1");
  }, [router]);

  return <SplashScreen subtitle="Preparing sign up" />;
}
