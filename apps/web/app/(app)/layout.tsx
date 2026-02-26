"use client";

import React, { useEffect } from "react";

import { AppShell } from "@/app/components/shells/AppShell";
import RouteGuard from "@/app/components/RouteGuard";
import { AppViewportFix } from "@/app/components/AppViewportFix";
import "./appShell.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-app-shell", "1");

    return () => {
      document.documentElement.removeAttribute("data-app-shell");
      document.body.classList.remove("app-entry-no-scroll");
    };
  }, []);

  return (
    <>
      <AppViewportFix />
      <RouteGuard requireActive>
        <AppShell>{children}</AppShell>
      </RouteGuard>
    </>
  );
}
