"use client";

import { usePathname } from "next/navigation";
import RouteGuard from "../components/RouteGuard";
import AppShell from "../components/AppShell";
import { isStandaloneDisplayMode } from "@/lib/displayMode";

const APP_PUBLIC_ROUTES = new Set(["/app/splash", "/app/get-started", "/app/login", "/app/home"]);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname && APP_PUBLIC_ROUTES.has(pathname) && isStandaloneDisplayMode()) {
    return <>{children}</>;
  }

  return (
    <RouteGuard requireActive>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
