"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../lib/session";

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
