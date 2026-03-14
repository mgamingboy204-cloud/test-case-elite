"use client";

import { useAuth } from "@/contexts/AuthContext";
import { X, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, PanInfo } from "framer-motion";
import { apiRequest } from "@/lib/api";

type IncomingLike = {
  id: string;
  createdAt: string;
  isSeen?: boolean;
  actorUser: {
    id: string;
    profile: {
      name?: string;
      age?: number;
      city?: string;
    } | null;
    photos: Array<{ url: string }>;
    displayName?: string | null;
    videoVerificationStatus?: string | null;
  };
  senderData?: {
    id: string;
    displayName: string;
    age: number | null;
    city: string | null;
    primaryPhotoUrl: string | null;
    canViewPhoto?: boolean;
    isPremium?: boolean;
    subscriptionStatus?: "NEW" | "SEEN" | string;
  };
};

type LikeProfile = {
  id: string;
  userId: string;
  name: string;
  age: number | null;
  location: string;
  image: string;
  createdAt: string;
  isSeen: boolean;
  isVerified: boolean;
  canViewPhoto: boolean;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80";

function formatLikeRecency(isoDate: string) {
  const timestamp = new Date(isoDate).getTime();
  if (!Number.isFinite(timestamp)) return "Liked you recently";

  const elapsedMs = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (elapsedMs < hour) {
    const minutes = Math.max(1, Math.floor(elapsedMs / minute));
    return `Liked you ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (elapsedMs < day) {
    const hours = Math.max(1, Math.floor(elapsedMs / hour));
    return `Liked you ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.max(1, Math.floor(elapsedMs / day));
  return `Liked you ${days} day${days === 1 ? "" : "s"} ago`;
}

export default function LikesPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<LikeProfile[]>([]);

  useEffect(() => {
    const loadIncoming = async () => {
      if (!isAuthenticated || onboardingStep !== "COMPLETED") return;
      const response = await apiRequest<{ incoming: IncomingLike[] }>("/likes/received", { auth: true });

      setProfiles(
        response.incoming.map((item) => {
          const senderName = item.senderData?.displayName ?? item.actorUser.profile?.name ?? item.actorUser.displayName ?? "Member";
          const senderAge = item.senderData?.age ?? item.actorUser.profile?.age ?? null;
          const senderCity = item.senderData?.city ?? item.actorUser.profile?.city ?? "Unknown";
          const senderImage = item.senderData?.primaryPhotoUrl ?? item.actorUser.photos[0]?.url ?? FALLBACK_IMAGE;
          const senderIsSeen = item.isSeen ?? item.senderData?.subscriptionStatus === "SEEN";

          return {
            id: item.id,
            userId: item.actorUser.id,
            name: senderName,
            age: senderAge,
            location: senderCity.toUpperCase(),
            image: senderImage,
            createdAt: item.createdAt,
            isSeen: senderIsSeen,
            isVerified: item.actorUser.videoVerificationStatus === "APPROVED",
            canViewPhoto: item.senderData?.canViewPhoto ?? item.senderData?.isPremium ?? true
          };
        })
      );
    };

    void loadIncoming();
  }, [isAuthenticated, onboardingStep]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/signin");
    else if (onboardingStep !== "COMPLETED") router.replace("/onboarding/verification");
  }, [isAuthenticated, onboardingStep, router]);

  const newLikesCount = useMemo(() => profiles.filter((profile) => !profile.isSeen).length, [profiles]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      setProfiles((prev) => {
        if (prev.length <= 1) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    } else if (info.offset.x > swipeThreshold) {
      setProfiles((prev) => {
        if (prev.length <= 1) return prev;
        const last = prev[prev.length - 1];
        const rest = prev.slice(0, prev.length - 1);
        return [last, ...rest];
      });
    }
  };

  const handleAction = async (action: "LIKE" | "PASS") => {
    const current = profiles[0];
    if (!current) return;

    setProfiles((prev) => prev.slice(1));

    try {
      await apiRequest("/likes", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          actionId: `${action}-${current.userId}-${Date.now()}`,
          targetUserId: current.userId,
          action
        })
      });
    } catch {
      // Keep optimistic UX.
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex-none w-full pt-8 pb-4 flex flex-col items-center justify-center z-50">
        <h1 className="text-xl tracking-[0.4em] font-medium text-primary drop-shadow-sm mb-1 uppercase">Likes</h1>
        <p className="text-[10px] text-foreground/30 font-bold tracking-widest uppercase">{newLikesCount} New Likes</p>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden" style={{ overscrollBehavior: "contain" }}>
        {profiles.length === 0 ? (
          <div className="text-foreground/40 text-sm font-light">No new likes.</div>
        ) : (
          profiles.map((profile, index) => {
            let offset = index;
            if (offset > Math.floor(profiles.length / 2)) {
              offset -= profiles.length;
            }
            const distance = Math.abs(offset);
            const isCenter = offset === 0;
            const isLeft = offset < 0;
            const isRight = offset > 0;

            let xPos = 0;
            if (isLeft) xPos = -90 - distance * 10;
            if (isRight) xPos = 90 + distance * 10;

            const scale = isCenter ? 1 : 0.9 - distance * 0.05;
            let opacity = isCenter ? 1 : 0.4 - distance * 0.1;
            if (opacity < 0) opacity = 0;

            const zIndex = isCenter ? profiles.length + 10 : profiles.length - distance;

            return (
              <motion.div
                key={profile.id}
                initial={false}
                animate={{
                  x: xPos,
                  scale,
                  opacity,
                  zIndex
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 25
                }}
                drag={isCenter ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={handleDragEnd}
                className={`absolute w-[320px] sm:w-[340px] h-[60vh] min-h-[460px] max-h-[580px] bg-background rounded-[2.5rem] border shadow-2xl flex flex-col p-6 will-change-transform touch-none ${
                  profile.isSeen ? "border-primary/10" : "border-primary/40"
                }`}
              >
                <div className="flex flex-col mb-4 px-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-serif text-white tracking-wide">
                      {profile.name}, <span className="font-light">{profile.age ?? "-"}</span>
                    </h2>
                    {profile.isVerified && <CheckVerifiedIcon />}
                    {!profile.isSeen && <span className="w-2 h-2 rounded-full bg-primary inline-block" aria-label="new like" />}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/50 mt-1">{profile.location}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-primary/80 mt-2">{formatLikeRecency(profile.createdAt)}</p>
                </div>

                <div className="flex-1 w-full relative rounded-2xl overflow-hidden mb-5 border border-white/5 bg-slate-800 pointer-events-none select-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className={`absolute inset-0 w-full h-full object-cover object-top ${profile.canViewPhoto ? "" : "blur-md scale-105"}`}
                    draggable={false}
                  />
                </div>

                <div className="flex justify-center gap-8 items-center w-full shrink-0">
                  <button
                    onClick={isCenter ? () => void handleAction("PASS") : undefined}
                    className="w-[64px] h-[64px] rounded-full bg-background/50 backdrop-blur-xl border border-primary/30 shadow-lg flex items-center justify-center hover:bg-primary/10 transition-colors pointer-events-auto"
                  >
                    <X size={28} strokeWidth={1} className="text-primary" />
                  </button>

                  <button
                    onClick={isCenter ? () => void handleAction("LIKE") : undefined}
                    className="w-[72px] h-[72px] rounded-full bg-background/50 backdrop-blur-xl border border-primary/50 shadow-2xl flex items-center justify-center hover:bg-primary/10 transition-colors pointer-events-auto"
                  >
                    <HeartEliteIconSmall />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
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

function HeartEliteIconSmall() {
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
