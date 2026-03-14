"use client";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useLikesReceived } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80";

export default function LikesPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useLikesReceived();
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/signin");
    else if (onboardingStep !== "COMPLETED") router.replace("/onboarding/verification");
  }, [isAuthenticated, onboardingStep, router]);

  const profiles = useMemo(() => (data?.incoming ?? []).filter((x: any) => !hidden.includes(x.id)), [data, hidden]);
  const current = profiles[0];

  async function handleAction(action: "LIKE" | "PASS") {
    if (!current) return;
    const targetUserId = current.sender_info?.id ?? current.actorUser?.id;
    setHidden((v) => [...v, current.id]);
    try {
      await apiRequest("/likes", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ action, targetUserId, actionId: `${action}-${targetUserId}-${Date.now()}` })
      });
      void queryClient.invalidateQueries({ queryKey: ["likes", "received"] });
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    } catch {
      setHidden((v) => v.filter((id) => id !== current.id));
    }
  }

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  return (
    <div className="w-full h-full px-6 pt-8 pb-20">
      <h1 className="text-xl tracking-[0.4em] text-primary uppercase text-center">Likes</h1>
      {isLoading ? (
        <div className="mt-8 h-[60vh] rounded-3xl bg-gradient-to-r from-[#E0BFB8]/10 via-[#E0BFB8]/20 to-[#E0BFB8]/10 animate-pulse" />
      ) : !current ? (
        <div className="text-center mt-24 text-foreground/50">No new likes.</div>
      ) : (
        <div className="mt-6 rounded-3xl border border-primary/30 p-4">
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
            <Image src={current.sender_info?.media_urls?.[0] ?? current.senderData?.primaryPhotoUrl ?? FALLBACK_IMAGE} alt={current.sender_info?.display_name ?? "Member"} fill className="object-cover" />
          </div>
          <h2 className="mt-3 text-3xl font-serif">{current.sender_info?.display_name ?? current.senderData?.displayName ?? "Member"}, <span className="font-light">{current.sender_info?.age ?? current.senderData?.age ?? "-"}</span></h2>
          <p className="text-xs uppercase tracking-wider text-foreground/60">{(current.sender_info?.city ?? current.senderData?.city ?? "Unknown").toUpperCase()}</p>
          <div className="mt-4 flex justify-between">
            <button onClick={() => void handleAction("PASS")} className="w-14 h-14 rounded-full border border-primary/30 flex items-center justify-center"><X /></button>
            <button onClick={() => void handleAction("LIKE")} className="w-16 h-16 rounded-full border border-primary/50">♥</button>
          </div>
        </div>
      )}
    </div>
  );
}
