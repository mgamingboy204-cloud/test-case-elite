"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyOtpRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/otp");
  }, [router]);
  return null;
}
