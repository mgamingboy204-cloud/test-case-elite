"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/app/components/shells/AdminShell";
import { useSession } from "@/lib/session";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "logged-out") {
      router.replace("/login");
      return;
    }
    if (user?.role !== "ADMIN" && !user?.isAdmin) {
      router.replace("/app");
    }
  }, [status, user, router]);

  if (status === "loading") return null;
  if (status !== "logged-in") return null;
  if (user?.role !== "ADMIN" && !user?.isAdmin) return null;

  return <AdminShell>{children}</AdminShell>;
}
