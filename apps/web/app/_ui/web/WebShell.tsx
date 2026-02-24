"use client";

import type { ReactNode } from "react";

export default function WebShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <main style={{ width: "100%", maxWidth: 1200, margin: "0 auto", padding: "24px 20px 48px" }}>{children}</main>
    </div>
  );
}
