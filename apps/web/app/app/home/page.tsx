"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

export default function AppHomePage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "logged-out") {
      router.replace("/app/login");
      return;
    }
    router.replace("/discover");
  }, [status, router]);

  return null;
}
