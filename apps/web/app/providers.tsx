"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { LiveUpdatesProvider } from "@/contexts/LiveUpdatesContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <QueryClientProvider client={getQueryClient()}>
        <AuthProvider>
          <LiveUpdatesProvider>
            <ServiceWorkerRegistration />
            {children}
          </LiveUpdatesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
