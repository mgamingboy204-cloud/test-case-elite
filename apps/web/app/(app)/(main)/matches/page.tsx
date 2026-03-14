"use client";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMatches } from "@/lib/hooks";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80";

export default function MatchesPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useMatches();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/signin");
    else if (onboardingStep !== "COMPLETED") router.replace("/onboarding/verification");
  }, [isAuthenticated, onboardingStep, router]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  const matches = data?.matches ?? [];

  return (
    <div className="w-full h-full px-6 pt-8 pb-20">
      <h1 className="text-xl tracking-[0.4em] text-primary uppercase text-center mb-8">Matches</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-gradient-to-r from-[#E0BFB8]/10 via-[#E0BFB8]/20 to-[#E0BFB8]/10 animate-pulse" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center text-foreground/50">No mutual matches yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {matches.map((match: any) => (
            <div key={match.id} className="space-y-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                <Image src={match.partnerInfo?.primaryPhotoUrl ?? FALLBACK_IMAGE} alt={match.partnerInfo?.name ?? "Member"} fill className="object-cover" />
              </div>
              <h3 className="font-serif text-lg">{match.partnerInfo?.name ?? "Member"}, <span className="font-light">{match.partnerInfo?.age ?? "-"}</span></h3>
              <p className="text-[10px] uppercase tracking-wider text-foreground/60">{(match.partnerInfo?.city ?? "Unknown").toUpperCase()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
