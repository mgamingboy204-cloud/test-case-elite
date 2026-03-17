"use client";

import { QueryClient } from "@tanstack/react-query";

let client: QueryClient | null = null;

export function getQueryClient() {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          gcTime: 30 * 60_000,
          retry: 1,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true
        }
      }
    });
  }

  return client;
}
