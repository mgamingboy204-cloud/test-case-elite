"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export type IdentityCard = {
  u_id: string;
  display_name: string;
  age: number | null;
  city: string | null;
  bio: string;
  media_urls: string[];
  is_premium?: boolean;
};

export function useDiscoverFeed() {
  return useQuery({
    queryKey: ["discover", "feed"],
    queryFn: () => apiRequest<{ items: Array<any> }>("/discover/feed?limit=5", { auth: true })
  });
}

export function useLikesReceived() {
  return useQuery({
    queryKey: ["likes", "received"],
    queryFn: () => apiRequest<{ incoming: Array<any> }>("/likes/received", { auth: true })
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: () => apiRequest<{ matches: Array<any> }>("/matches", { auth: true })
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => apiRequest<{ notifications: Array<any> }>("/notifications", { auth: true }),
    refetchInterval: 15000
  });
}
