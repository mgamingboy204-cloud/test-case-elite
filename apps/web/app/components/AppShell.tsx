"use client";

import type { ReactNode } from "react";
import AppShellLayout from "./ui/AppShellLayout";

export default function AppShell({ children }: { children: ReactNode }) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
