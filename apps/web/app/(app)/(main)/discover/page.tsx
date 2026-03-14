"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, Ruler, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { apiRequest } from "@/lib/api";

type LegacyDiscoverFeedItem = {
  userId: string;
  name: string;
  age: number;
  city: string;
  bioShort: string;
  primaryPhotoUrl: string | null;
};

type LegacyDiscoverFeedResponse = {
  items: LegacyDiscoverFeedItem[];
  nextCursor?: string;
};

type DiscoverCard = {
  id: string;
  displayName: string;
  age: number;
  locationLabel: string;
  bio: string;
  imageUrl: string | null;
};

function mapLegacyFeedItemToCard(item: LegacyDiscoverFeedItem): DiscoverCard {
  return {
    id: item.userId,
    displayName: item.name,
    age: item.age,
    locationLabel: item.city,
    bio: item.bioShort,
    imageUrl: item.primaryPhotoUrl
  };
}

function buildActionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `discover-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function DiscoverPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasScrolled, setHasScrolled] = useState(false);
  const [cards, setCards] = useState<DiscoverCard[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isFetching, setIsFetching] = useState(false);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/signin");
    else if (onboardingStep !== "COMPLETED") router.replace("/onboarding/verification");
  }, [isAuthenticated, onboardingStep, router]);

  useEffect(() => {
    const loadDiscover = async () => {
      if (!isAuthenticated || onboardingStep !== "COMPLETED") return;
      setIsFetching(true);
      try {
        const response = await apiRequest<LegacyDiscoverFeedResponse>("/discover/feed?limit=5", { auth: true });
        setCards(response.items.map(mapLegacyFeedItemToCard));
        setNextCursor(response.nextCursor);
      } finally {
        setIsFetching(false);
      }
    };

    void loadDiscover();
  }, [isAuthenticated, onboardingStep]);

  const loadMoreCards = async () => {
    if (isFetching || !nextCursor) return;
    setIsFetching(true);
    try {
      const response = await apiRequest<LegacyDiscoverFeedResponse>(`/discover/feed?limit=5&cursor=${encodeURIComponent(nextCursor)}`, {
        auth: true
      });
      setCards((prev) => [...prev, ...response.items.map(mapLegacyFeedItemToCard)]);
      setNextCursor(response.nextCursor);
    } finally {
      setIsFetching(false);
    }
  };

  const handleInteraction = async (action: "LIKE" | "PASS") => {
    const current = cards[0];
    if (!current || isActing) return;

    setIsActing(true);
    try {
      await apiRequest<{ ok: boolean; matchId?: string | null; alreadyProcessed?: boolean }>("/likes", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          actionId: buildActionId(),
          targetUserId: current.id,
          action
        })
      });

      setCards((prev) => prev.slice(1));

      if (cards.length <= 2 && nextCursor) {
        await loadMoreCards();
      }
    } finally {
      setIsActing(false);
    }
  };

  const card = cards[0] ?? null;

  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ["start start", "end start"]
  });

  const photoOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.5]);
  const photoScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  return (
    <div className="w-full h-full relative bg-background transition-colors duration-500 overflow-hidden flex flex-col">
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory relative no-scrollbar"
        onScroll={(e) => setHasScrolled((e.target as HTMLDivElement).scrollTop > 50)}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="w-full relative snap-start">
          <div className="relative z-10 w-full">
            <motion.div
              style={{ opacity: photoOpacity, scale: photoScale, transformOrigin: "top center" }}
              className="w-full h-[80vh] overflow-hidden relative shadow-2xl bg-slate-900"
            >
              <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-gradient-to-t from-black/[0.08] to-transparent z-10 pointer-events-none" />
              <img
                src={card?.imageUrl ?? "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=2127&auto=format&fit=crop"}
                alt={card?.displayName ?? "Member"}
                className="w-full h-full object-cover object-center"
              />

              <div className="absolute bottom-10 left-8 z-20">
                <h1 className="text-6xl font-serif text-white mb-3 drop-shadow-xl tracking-wide">
                  {card?.displayName ?? "No more profiles"}, <span className="font-light">{card?.age ?? "-"}</span>
                </h1>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.3em] text-white/95 bg-black/30 backdrop-blur-xl w-fit px-4 py-2 rounded-full border border-white/10">
                  <div className="w-2 h-2 rotate-45 bg-primary shadow-[0_0_12px_rgba(200,155,144,0.8)]" />
                  {card?.locationLabel ?? "Check back soon"}
                </div>
              </div>
            </motion.div>

            <div className="w-full mt-10 flex flex-col gap-12 px-6 md:px-12 pb-40">
              <motion.div
                initial={{ opacity: 0.2, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ root: containerRef, margin: "-20px" }}
                transition={{ duration: 0.8 }}
                className="w-full"
              >
                <p className="text-3xl md:text-4xl font-serif text-foreground leading-[1.3] italic font-light">
                  {card?.bio ? `"${card.bio}"` : '"You\'ve reached the end of this batch. New profiles will appear soon."'}
                </p>
              </motion.div>

              <div className="grid grid-cols-2 gap-5">
                <InfoPill icon={Briefcase} text="Art Director" />
                <InfoPill icon={Ruler} text="5'8&quot; (173cm)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-10 px-10 flex justify-between items-end z-40 w-full max-w-lg mx-auto pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          disabled={!card || isActing}
          onClick={() => void handleInteraction("PASS")}
          className="w-[76px] h-[76px] rounded-full bg-background/40 backdrop-blur-2xl border border-primary/40 flex items-center justify-center pointer-events-auto relative overflow-hidden group shadow-xl disabled:opacity-40"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <X size={34} strokeWidth={1} className="text-primary drop-shadow-sm z-10" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          disabled={!card || isActing}
          onClick={() => void handleInteraction("LIKE")}
          className="w-28 h-28 rounded-full bg-background/40 backdrop-blur-3xl shadow-[0_20px_50px_rgba(200,155,144,0.2)] border border-primary/60 flex items-center justify-center pointer-events-auto relative overflow-hidden group disabled:opacity-40"
        >
          <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <HeartEliteIcon />
        </motion.button>
      </div>

      {isFetching && (
        <div className="absolute top-4 right-4 text-xs uppercase tracking-[0.2em] text-foreground/50">
          Loading...
        </div>
      )}
      {hasScrolled && <div className="sr-only">scrolled</div>}
    </div>
  );
}

function InfoPill({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-foreground/5 metallic-border backdrop-blur-md">
      <Icon size={18} className="text-highlight" strokeWidth={1} />
      <span className="text-xs uppercase tracking-[0.15em] font-medium text-foreground/90">{text}</span>
    </div>
  );
}

function HeartEliteIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="z-10 drop-shadow-[0_0_15px_rgba(200,155,144,0.4)]">
      <path
        d="M12 21C12 21 4.5 14.5 4.5 8.5C4.5 5.5 6.5 3.5 9 3.5C10.5 3.5 11.5 4 12 5C12.5 4 13.5 3.5 15 3.5C17.5 3.5 19.5 5.5 19.5 8.5C19.5 14.5 12 21 12 21Z"
        stroke="url(#goldGradient)"
        strokeWidth="1.2"
      />
      <defs>
        <linearGradient id="goldGradient" x1="4.5" y1="3.5" x2="19.5" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary)" stopOpacity="1" />
          <stop offset="1" stopColor="var(--highlight)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
