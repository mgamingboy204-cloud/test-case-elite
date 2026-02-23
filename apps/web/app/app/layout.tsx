"use client";

import { usePathname } from "next/navigation";
import RouteGuard from "../components/RouteGuard";
import AppShell from "../components/AppShell";

const APP_ENTRY_ROUTES = new Set(["/app", "/app/splash", "/app/get-started", "/app/login"]);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname && APP_ENTRY_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <RouteGuard requireActive>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
