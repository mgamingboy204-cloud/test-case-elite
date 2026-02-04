"use client";

import RouteGuard from "../components/RouteGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard requireActive>{children}</RouteGuard>;
}
