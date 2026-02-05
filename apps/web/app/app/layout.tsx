"use client";

import RouteGuard from "../components/RouteGuard";
import BottomNav from "../components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireActive>
      <div className="app-shell">
        {children}
        <BottomNav />
      </div>
    </RouteGuard>
  );
}
