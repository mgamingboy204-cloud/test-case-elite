"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import { normalizeApiError } from "@/lib/apiErrors";
import { fetchIncomingLikes, respondToIncomingLike, type LikesIncomingProfile } from "@/lib/likes";
import { fetchAlerts, fetchMatches } from "@/lib/queries";
import { primeCache, useStaleWhileRevalidate } from "@/lib/cache";
import { X, Check, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { motion, type PanInfo } from "framer-motion";

type ViewState = "loading" | "success" | "empty" | "error";
const LIKES_CACHE_KEY = "likes-incoming";

export default function LikesPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const likesQuery = useStaleWhileRevalidate({
    key: LIKES_CACHE_KEY,
    fetcher: fetchIncomingLikes,
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    staleTimeMs: 60_000
  });

  useLiveResourceRefresh({
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    refresh: () => likesQuery.refresh(true),
    fallbackIntervalMs: 60_000
  });

  const profiles = likesQuery.data ?? [];
  const state: ViewState = useMemo(() => {
    if (likesQuery.isLoading && profiles.length === 0) return "loading";
    if (likesQuery.error && profiles.length === 0) return "error";
    if (profiles.length === 0) return "empty";
    return "success";
  }, [likesQuery.error, likesQuery.isLoading, profiles.length]);

  const persist = (items: LikesIncomingProfile[]) => {
    likesQuery.setData(items);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (pendingProfileId) return;

    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      likesQuery.mutate((current = []) => {
        if (current.length <= 1) return current;
        const [first, ...rest] = current;
        return [...rest, first];
      });
      return;
    }

    if (info.offset.x > swipeThreshold) {
      likesQuery.mutate((current = []) => {
        if (current.length <= 1) return current;
        const last = current[current.length - 1];
        const rest = current.slice(0, current.length - 1);
        return [last, ...rest];
      });
    }
  };

  const handleAction = async (action: "LIKE" | "PASS") => {
    const current = profiles[0];
    if (!current || pendingProfileId) return;

    const previousCards = profiles;
    const nextCards = previousCards.slice(1);
    setPendingProfileId(current.profileId);
    setActionError(null);
    persist(nextCards);

    try {
      const response = await respondToIncomingLike({ targetUserId: current.profileId, action });
      if (response.matchId) {
        void fetchMatches().then((data) => primeCache("matches", data));
        void fetchAlerts().then((data) => primeCache("alerts", data));
      }
    } catch (error) {
      persist(previousCards);
      const normalized = normalizeApiError(error);
      setActionError(normalized.message);
    } finally {
      setPendingProfileId(null);
    }
  };

  const countLabel = useMemo(() => {
    if (state === "loading") return "Preparing your incoming interests";
    if (state === "error") return "Unable to load incoming interests";
    return `${profiles.length} Incoming likes`;
  }, [profiles.length, state]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex-none w-full pt-8 pb-4 flex flex-col items-center justify-center z-50">
        <h1 className="text-xl tracking-[0.4em] font-medium text-primary drop-shadow-sm mb-1 uppercase">Likes</h1>
        <p className="text-[10px] text-foreground/30 font-bold tracking-widest uppercase">{countLabel}</p>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden" style={{ overscrollBehavior: "contain" }}>
        {state === "loading" && <LoadingCard />}

        {state === "error" && (
          <div className="flex flex-col items-center gap-3 text-center px-8">
            <p className="text-sm text-foreground/70">We couldn’t load your likes right now.</p>
            <button
              onClick={() => void likesQuery.refresh(true)}
              className="rounded-full border border-primary/50 px-6 py-2 text-[11px] uppercase tracking-[0.2em] text-primary hover:bg-primary/10 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {state === "empty" && (
          <p className="text-foreground/50 text-sm font-light text-center px-10">
            No likes yet. Come back soon.
          </p>
        )}

        {state === "success" &&
          profiles.map((profile, index) => {
            let offset = index;
            if (offset > Math.floor(profiles.length / 2)) offset -= profiles.length;

            const distance = Math.abs(offset);
            const isCenter = offset === 0;
            const xPos = offset < 0 ? -90 - distance * 10 : offset > 0 ? 90 + distance * 10 : 0;
            const scale = isCenter ? 1 : 0.9 - distance * 0.05;
            const opacity = Math.max(isCenter ? 1 : 0.4 - distance * 0.1, 0);
            const zIndex = isCenter ? profiles.length + 10 : profiles.length - distance;
            const isPending = pendingProfileId === profile.profileId;

            return (
              <motion.div
                key={profile.likeId}
                initial={false}
                animate={{ x: xPos, scale, opacity, zIndex }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                drag={isCenter && !pendingProfileId ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={handleDragEnd}
                className="absolute w-[320px] sm:w-[340px] h-[60vh] min-h-[460px] max-h-[580px] bg-background rounded-[2.5rem] border border-primary/20 shadow-2xl flex flex-col p-6 will-change-transform touch-none"
              >
                <div className="flex flex-col mb-4 px-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-serif text-white tracking-wide">
                      {profile.name}, <span className="font-light">{profile.age || "—"}</span>
                    </h2>
                    <CheckVerifiedIcon />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/50 mt-1">{profile.location || "PRIVATE LOCATION"}</p>
                </div>

                <div className="flex-1 w-full relative rounded-2xl overflow-hidden mb-5 border border-white/5 bg-slate-800 pointer-events-none select-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                  <img src={profile.image} alt={profile.name} className="absolute inset-0 w-full h-full object-cover object-top" draggable={false} />
                </div>

                <div className="flex justify-center gap-8 items-center w-full shrink-0">
                  <button
                    type="button"
                    onClick={isCenter ? () => void handleAction("PASS") : undefined}
                    disabled={!isCenter || Boolean(pendingProfileId)}
                    aria-label="Pass"
                    title="Pass"
                    className="w-[64px] h-[64px] rounded-full bg-background/50 backdrop-blur-xl border border-primary/30 shadow-lg flex items-center justify-center hover:bg-primary/10 transition-colors pointer-events-auto disabled:opacity-50"
                  >
                    {isPending ? <Loader2 size={24} className="text-primary animate-spin" /> : <X size={28} strokeWidth={1} className="text-primary" />}
                  </button>

                  <button
                    type="button"
                    onClick={isCenter ? () => void handleAction("LIKE") : undefined}
                    disabled={!isCenter || Boolean(pendingProfileId)}
                    aria-label="Like back"
                    title="Like back"
                    className="w-[72px] h-[72px] rounded-full bg-background/50 backdrop-blur-xl border border-primary/50 shadow-2xl flex items-center justify-center hover:bg-primary/10 transition-colors pointer-events-auto disabled:opacity-50"
                  >
                    {isPending ? <Loader2 size={26} className="text-primary animate-spin" /> : <HeartVaelIconSmall />}
                  </button>
                </div>
              </motion.div>
            );
          })}
      </div>

      {actionError && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-10 text-xs tracking-wide text-foreground bg-background/80 border border-border/30 rounded-full px-4 py-2 backdrop-blur-lg z-50">
          {actionError}
        </div>
      )}

      {likesQuery.isRefreshing && state === "success" && (
        <div className="absolute right-6 top-7 text-foreground/40">
          <Loader2 size={16} className="animate-spin" />
        </div>
      )}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="w-[320px] sm:w-[340px] h-[60vh] min-h-[460px] max-h-[580px] rounded-[2.5rem] border border-primary/20 bg-background p-6 animate-pulse">
      <div className="h-7 w-2/3 rounded bg-foreground/10 mb-4" />
      <div className="h-4 w-1/3 rounded bg-foreground/10 mb-6" />
      <div className="h-[65%] rounded-2xl bg-foreground/10" />
      <div className="mt-6 flex justify-center gap-8">
        <div className="w-16 h-16 rounded-full bg-foreground/10" />
        <div className="w-20 h-20 rounded-full bg-foreground/10" />
      </div>
    </div>
  );
}

function CheckVerifiedIcon() {
  return (
    <div className="w-[20px] h-[20px] rounded-full bg-primary flex items-center justify-center shadow-lg ml-1">
      <Check size={12} strokeWidth={3} className="text-background" />
    </div>
  );
}

function HeartVaelIconSmall() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
      <path
        d="M12 21C12 21 4.5 14.5 4.5 8.5C4.5 5.5 6.5 3.5 9 3.5C10.5 3.5 11.5 4 12 5C12.5 4 13.5 3.5 15 3.5C17.5 3.5 19.5 5.5 19.5 8.5C19.5 14.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-primary"
      />
    </svg>
  );
}
