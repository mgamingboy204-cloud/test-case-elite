"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/app/components/shells/AdminShell";
import { useSession } from "@/lib/session";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, user, refresh } = useSession();
  const [checkedAdmin, setCheckedAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAdminAccess = async () => {
      if (status === "loading") return;
      if (status === "logged-out") {
        router.replace("/login");
        return;
      }

      const freshUser = await refresh();
      if (!mounted) return;

      if (!freshUser || (freshUser.role !== "ADMIN" && !freshUser.isAdmin)) {
        router.replace("/app");
        return;
      }

      setCheckedAdmin(true);
    };

    void checkAdminAccess();

    return () => {
      mounted = false;
    };
  }, [status, refresh, router]);

  if (status === "loading" || !checkedAdmin) return null;
  if (status !== "logged-in") return null;
  if (user?.role !== "ADMIN" && !user?.isAdmin) return null;

  return <AdminShell>{children}</AdminShell>;
}
