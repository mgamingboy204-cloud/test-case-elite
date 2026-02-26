"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import RouteGuard from "../components/RouteGuard";
import { AppShell } from "../components/shells/AppShell";
import { AppViewportFix } from "../components/AppViewportFix";

const APP_ENTRY_ROUTES = new Set(["/pwa_app", "/pwa_app/splash", "/pwa_app/get-started", "/signup", "/login"]);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.setAttribute("data-app-shell", "1");

    return () => {
      document.documentElement.removeAttribute("data-app-shell");
      document.body.classList.remove("app-entry-no-scroll");
    };
  }, []);

  if (pathname && APP_ENTRY_ROUTES.has(pathname)) {
    return (
      <>
        <AppViewportFix />
        {children}
      </>
    );
  }

  return (
    <>
      <AppViewportFix />
      <RouteGuard requireActive loggedOutRedirect="/pwa_app/get-started">
        <AppShell>{children}</AppShell>
      </RouteGuard>
    </>
  );
}
