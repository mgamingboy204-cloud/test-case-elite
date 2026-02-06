"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../lib/session";
import { ThemeProvider } from "./components/ThemeProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
