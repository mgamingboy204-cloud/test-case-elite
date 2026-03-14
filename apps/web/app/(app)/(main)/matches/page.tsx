"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { CheckCircle2, Loader2, Lock, Unlock, X } from "lucide-react";

type ApiMatch = {
  id: string;
  matchedAt?: string;
  createdAt: string;
  status?: string;
  consentStatus?: string;
  isNumberShared?: boolean;
  phoneExchangeReady?: boolean;
  myConsent?: "YES" | "NO" | null;
  partnerInfo?: {
    id: string;
    name: string;
    age: number | null;
    city: string | null;
    primaryPhotoUrl: string | null;
    likedPhotoUrl?: string | null;
  };
  user?: {
    id: string;
    name: string;
    city: string | null;
    primaryPhotoUrl: string | null;
  };
};

type MatchCard = {
  id: string;
  partnerId: string;
  name: string;
  age: number | null;
  location: string;
  image: string;
  matchedAt: string;
  status: string;
  isNumberShared: boolean;
  myConsent: "YES" | "NO" | null;
};

type PhoneUnlockResponse = {
  matchId: string;
  users: Array<{ id: string; phone: string }>;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80";

function formatMatchedOn(isoDate: string) {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return "Matched recently";
  return `Matched on ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function mapMatch(item: ApiMatch): MatchCard {
  const partner = item.partnerInfo ?? item.user;

  return {
    id: item.id,
    partnerId: partner?.id ?? "",
    name: partner?.name ?? "Member",
    age: item.partnerInfo?.age ?? null,
    location: (item.partnerInfo?.city ?? item.user?.city ?? "Unknown").toUpperCase(),
    image: item.partnerInfo?.likedPhotoUrl ?? partner?.primaryPhotoUrl ?? FALLBACK_IMAGE,
    matchedAt: item.matchedAt ?? item.createdAt,
    status: item.status ?? "Status unavailable",
    isNumberShared: item.isNumberShared ?? item.phoneExchangeReady ?? false,
    myConsent: item.myConsent ?? null
  };
}

export default function MatchesPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();

  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/signin");
    else if (onboardingStep !== "COMPLETED") router.replace("/onboarding/verification");
  }, [isAuthenticated, onboardingStep, router]);

  const loadMatches = useCallback(async () => {
    if (!isAuthenticated || onboardingStep !== "COMPLETED") return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ matches: ApiMatch[] }>("/matches", { auth: true });
      const mapped = response.matches.map(mapMatch);
      setMatches(mapped);

      setSelectedMatch((current) => {
        if (!current) return current;
        return mapped.find((match) => match.id === current.id) ?? null;
      });
    } catch {
      setError("Could not load matches right now.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, onboardingStep]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const activeMatches = useMemo(() => matches, [matches]);

  const submitConsent = async (response: "YES" | "NO") => {
    if (!selectedMatch) return;

    setIsSubmittingConsent(true);
    try {
      await apiRequest("/consent/respond", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ matchId: selectedMatch.id, response })
      });
      await loadMatches();
    } finally {
      setIsSubmittingConsent(false);
    }
  };

  const revealNumber = async () => {
    if (!selectedMatch) return;

    const response = await apiRequest<PhoneUnlockResponse>(`/phone-unlock/${selectedMatch.id}`, { auth: true });
    const partner = response.users.find((user) => user.id === selectedMatch.partnerId);
    setRevealedPhone(partner?.phone ?? "Unavailable");
  };

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  return (
    <div className="w-full h-full relative px-6 md:px-8 pt-8 pb-20">
      <div className="w-full pb-8 flex flex-col items-center justify-center z-10">
        <h1 className="text-xl tracking-[0.4em] font-medium text-primary drop-shadow-sm uppercase">Matches</h1>
      </div>

      {isLoading ? (
        <div className="w-full flex justify-center py-12 text-foreground/60">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center text-sm text-red-400">{error}</div>
      ) : activeMatches.length === 0 ? (
        <div className="text-center text-sm text-foreground/40">No mutual matches yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 auto-rows-max">
          {activeMatches.map((match) => (
            <button
              key={match.id}
              onClick={() => {
                setSelectedMatch(match);
                setRevealedPhone(null);
              }}
              className="relative w-full flex flex-col text-left"
            >
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
                <img src={match.image} alt={match.name} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="pt-3 pb-1 px-1">
                <h3 className="text-base font-serif text-foreground tracking-wide">
                  {match.name}, <span className="font-light">{match.age ?? "-"}</span>
                </h3>
                <p className="text-[9px] uppercase tracking-[0.2em] font-medium text-foreground/40 mt-0.5">{match.location}</p>
                <p className="text-[10px] text-primary/80 mt-1">{formatMatchedOn(match.matchedAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedMatch(null)} aria-label="Close" />
          <div className="relative z-[105] w-full max-w-sm rounded-[2rem] overflow-hidden bg-background border border-primary/20 shadow-2xl">
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 border border-white/20 flex items-center justify-center"
            >
              <X size={18} className="text-white" />
            </button>

            <div className="aspect-square relative">
              <img src={selectedMatch.image} alt={selectedMatch.name} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <h2 className="text-3xl font-serif text-white">
                  {selectedMatch.name}, <span className="font-light">{selectedMatch.age ?? "-"}</span>
                </h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary mt-1">{selectedMatch.location}</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-foreground/70">{formatMatchedOn(selectedMatch.matchedAt)}</p>
              <p className="text-sm text-foreground/80">{selectedMatch.status}</p>

              {selectedMatch.isNumberShared ? (
                <div className="space-y-3">
                  <button
                    onClick={() => void revealNumber()}
                    className="w-full h-11 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-medium"
                  >
                    <Unlock size={16} className="inline mr-2" />
                    View Number
                  </button>
                  {revealedPhone && <p className="text-center text-lg tracking-wider text-foreground">{revealedPhone}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => void submitConsent("NO")}
                    disabled={isSubmittingConsent}
                    className="h-11 rounded-xl border border-white/20 text-sm text-foreground/80 disabled:opacity-60"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => void submitConsent("YES")}
                    disabled={isSubmittingConsent || selectedMatch.myConsent === "YES"}
                    className="h-11 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-medium disabled:opacity-60"
                  >
                    {isSubmittingConsent ? (
                      <Loader2 size={16} className="inline animate-spin" />
                    ) : selectedMatch.myConsent === "YES" ? (
                      <>
                        <CheckCircle2 size={16} className="inline mr-2" />
                        Shared
                      </>
                    ) : (
                      <>
                        <Lock size={16} className="inline mr-2" />
                        Share My Number
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
