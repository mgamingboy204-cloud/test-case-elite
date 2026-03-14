"use client";

import { useAuth } from "@/contexts/AuthContext";
import { X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, PanInfo } from "framer-motion";
import { apiRequest } from "@/lib/api";

type LikeProfile = {
  id: string;
  name: string;
  age: number;
  location: string;
  image: string;
  userId: string;
};

type IncomingLike = {
  id: string;
  actorUser: {
    id: string;
    profile: {
      name: string;
      age: number;
      city: string;
    } | null;
    photos: Array<{ url: string }>;
  };
};

export default function LikesPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<LikeProfile[]>([]);

  useEffect(() => {
    const loadIncoming = async () => {
      if (!isAuthenticated || onboardingStep !== "COMPLETED") return;
      const response = await apiRequest<{ incoming: IncomingLike[] }>("/likes/incoming", { auth: true });
      setProfiles(
        response.incoming.map((item) => ({
          id: item.id,
          name: item.actorUser.profile?.name ?? "Member",
          age: item.actorUser.profile?.age ?? 0,
          location: (item.actorUser.profile?.city ?? "Unknown").toUpperCase(),
          image: item.actorUser.photos[0]?.url ?? "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80",
          userId: item.actorUser.id
        }))
      );
    };

    void loadIncoming();
  }, [isAuthenticated, onboardingStep]);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/signin');
    else if (onboardingStep !== 'COMPLETED') router.replace('/onboarding/verification'); 
  }, [isAuthenticated, onboardingStep, router]);

  if (!isAuthenticated || onboardingStep !== 'COMPLETED') return null;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swipe Left
      setProfiles(prev => {
        if (prev.length <= 1) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    } else if (info.offset.x > swipeThreshold) {
      // Swipe Right
      setProfiles(prev => {
        if (prev.length <= 1) return prev;
        const last = prev[prev.length - 1];
        const rest = prev.slice(0, prev.length - 1);
        return [last, ...rest];
      });
    }
  };

  const handleAction = async (action: "LIKE" | "PASS") => {
    setProfiles((prev) => {
      if (prev.length === 0) return prev;
      const [_first, ...rest] = prev;
      return rest;
    });

    const current = profiles[0];
    if (!current) return;

    try {
      await apiRequest("/likes", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          actionId: crypto.randomUUID(),
          targetUserId: current.userId,
          action
        })
      });
    } catch {
      // keep optimistic UX
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      
      {/* Page Header */}
      <div className="flex-none w-full pt-8 pb-4 flex flex-col items-center justify-center z-50">
        <h1 className="text-xl tracking-[0.4em] font-medium text-primary drop-shadow-sm mb-1 uppercase">
          Likes
        </h1>
        <p className="text-[10px] text-foreground/30 font-bold tracking-widest uppercase">
          {profiles.length} Selective Interests
        </p>
      </div>

      {/* 3D Carousel Container — fixed height so absolute children render */}
      <div
        className="flex-1 w-full relative flex items-center justify-center overflow-hidden"
        style={{ overscrollBehavior: 'contain' }}
      >
         {profiles.length === 0 ? (
            <div className="text-foreground/40 text-sm font-light">No new likes.</div>
         ) : profiles.map((profile, index) => {
            let offset = index;
            if (offset > Math.floor(profiles.length / 2)) {
                offset -= profiles.length;
            }
            const distance = Math.abs(offset);
            
            const isCenter = offset === 0;
            const isLeft = offset < 0;
            const isRight = offset > 0;
            
            // Layout calculations for Coverflow Effect
            let xPos = 0;
            if (isLeft) xPos = -90 - (distance * 10);
            if (isRight) xPos = 90 + (distance * 10);

            const scale = isCenter ? 1 : 0.9 - (distance * 0.05);
            let opacity = isCenter ? 1 : 0.4 - (distance * 0.1);
            if (opacity < 0) opacity = 0;
            
            // Center card wins the highest z-index; background cards step down
            const zIndex = isCenter ? profiles.length + 10 : profiles.length - distance;

            return (
              <motion.div
                key={profile.id}
                initial={false}
                animate={{
                  x: xPos,
                  scale: scale,
                  opacity: opacity,
                  zIndex: zIndex,
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
                className="absolute w-[320px] sm:w-[340px] h-[60vh] min-h-[460px] max-h-[580px] bg-background rounded-[2.5rem] border border-primary/20 shadow-2xl flex flex-col p-6 will-change-transform touch-none"
              >
                {/* TOP: Text Header */}
                <div className="flex flex-col mb-4 px-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-serif text-white tracking-wide">
                      {profile.name}, <span className="font-light">{profile.age}</span>
                    </h2>
                    <CheckVerifiedIcon />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/50 mt-1">
                    {profile.location}
                  </p>
                </div>

                {/* MIDDLE: Framed Photo */}
                <div className="flex-1 w-full relative rounded-2xl overflow-hidden mb-5 border border-white/5 bg-slate-800 pointer-events-none select-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                  <img 
                    src={profile.image} 
                    alt={profile.name}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    draggable={false}
                  />
                </div>

                {/* BOTTOM: Embedded Actions */}
                <div className="flex justify-center gap-8 items-center w-full shrink-0">
                  {/* Pass Button */}
                  <button 
                    onClick={isCenter ? () => void handleAction("PASS") : undefined}
                    className="w-[64px] h-[64px] rounded-full bg-background/50 backdrop-blur-xl border border-primary/30 shadow-lg flex items-center justify-center hover:bg-primary/10 transition-colors pointer-events-auto"
                  >
                    <X size={28} strokeWidth={1} className="text-primary" />
                  </button>
                  
                  {/* Like Button */}
                  <button 
                    onClick={isCenter ? () => void handleAction("LIKE") : undefined}
                    className="w-[72px] h-[72px] rounded-full bg-background/50 backdrop-blur-xl border border-primary/50 shadow-2xl flex items-center justify-center hover:bg-primary/10 transition-colors pointer-events-auto"
                  >
                    <HeartEliteIconSmall />
                  </button>
                </div>
              </motion.div>
            );
         })}
      </div>

    </div>
  );
}

function CheckVerifiedIcon() {
  return (
    <div className="w-[20px] h-[20px] rounded-full bg-primary flex items-center justify-center shadow-lg ml-1">
      <Check size={12} strokeWidth={3} className="text-background" />
    </div>
  )
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
