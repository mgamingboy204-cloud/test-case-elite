"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";

export default function DeprecatedPwaSignupPhone() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signup");
  }, [router]);

  return <SplashScreen subtitle="Preparing sign up" />;
}
