"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupEntryPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/phone");
  }, [router]);
  return null;
}
