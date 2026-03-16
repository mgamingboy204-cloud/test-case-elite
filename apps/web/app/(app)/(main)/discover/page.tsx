"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, Ruler, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ApiError } from "@/lib/api";
import { sendLikeAction } from "@/lib/likes";
import { fetchAlerts, fetchDiscoverFeedPage, fetchMatches, mapLegacyFeedItemToCard, type DiscoverCard } from "@/lib/queries";
import { primeCache, readCache } from "@/lib/cache";

type DiscoverState = {
  cards: DiscoverCard[];
  nextCursor?: string;
};

type PageStatus = "loading" | "success" | "empty" | "error";

type PendingAction = { id: string; action: "LIKE" | "PASS" };

function buildActionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `discover-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

const DISCOVER_CACHE_KEY = "discover-feed";
const BUFFER_TARGET = 10;
const REFILL_THRESHOLD = 4;
const FALLBACK_DISCOVER_IMAGE = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=2127&auto=format&fit=crop";

function preloadImage(url: string | null | undefined) {
  if (!url || typeof window === "undefined") return;
  const image = new Image();
  image.decoding = "async";
  image.src = url;
}

export default function DiscoverPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const cached = readCache<DiscoverState>(DISCOVER_CACHE_KEY)?.value;
  const [hasScrolled, setHasScrolled] = useState(false);
  const [cards, setCards] = useState<DiscoverCard[]>(cached?.cards ?? []);
  const [nextCursor, setNextCursor] = useState<string | undefined>(cached?.nextCursor);
  const [isFetching, setIsFetching] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [status, setStatus] = useState<PageStatus>(cached?.cards?.length ? "success" : "loading");

  const persistState = (nextCards: DiscoverCard[], cursor?: string) => {
    primeCache(DISCOVER_CACHE_KEY, { cards: nextCards, nextCursor: cursor });
  };

  const fetchPage = async (cursor?: string) => {
    const response = await fetchDiscoverFeedPage(cursor, BUFFER_TARGET);
    const mapped = response.items.map(mapLegacyFeedItemToCard);
    return {
      // De-dupe is handled when merging into the existing buffer.
      items: mapped,
      nextCursor: response.nextCursor
    };
  };

  const refillBuffer = async () => {
    if (isFetching || !nextCursor) return;
    setIsFetching(true);
    try {
      const next = await fetchPage(nextCursor);
      setCards((prev) => {
        const existingIds = new Set(prev.map((entry) => entry.id));
        const uniqueIncoming = next.items.filter((entry) => !existingIds.has(entry.id));
        const merged = [...prev, ...uniqueIncoming];
        persistState(merged, next.nextCursor);
        if (merged.length === 0) {
          setStatus("empty");
        }
        return merged;
      });
      setNextCursor(next.nextCursor);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!isAuthenticated || onboardingStep !== "COMPLETED") return;
      if (cards.length > 0) {
        setStatus("success");
        void refillBuffer();
        return;
      }

      setStatus("loading");
      setIsFetching(true);
      try {
        const first = await fetchPage();
        setCards(first.items);
        setNextCursor(first.nextCursor);
        persistState(first.items, first.nextCursor);
        setStatus(first.items.length ? "success" : "empty");
      } catch {
        setStatus("error");
      } finally {
        setIsFetching(false);
      }
    };

    void bootstrap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, onboardingStep]);

  useEffect(() => {
    if (status === "success" && cards.length <= REFILL_THRESHOLD && nextCursor) {
      void refillBuffer();
    }
    cards.slice(1, 4).forEach((card) => preloadImage(card.imageUrl));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, nextCursor, status]);

  const handleInteraction = async (action: "LIKE" | "PASS") => {
    const current = cards[0];
    if (!current || pendingAction) return;

    const actionId = buildActionId();
    setPendingAction({ id: actionId, action });
    setActionError(null);

    const previousCards = cards;
    const nextCards = previousCards.slice(1);
    setCards(nextCards);
    persistState(nextCards, nextCursor);
    if (nextCards.length === 0 && !nextCursor) {
      setStatus("empty");
    }

    try {
      const response = await sendLikeAction({ actionId, targetUserId: current.id, action });
      if (response.matchId) {
        void fetchMatches().then((data) => primeCache("matches", data));
        void fetchAlerts().then((data) => primeCache("alerts", data));
      }
      if (nextCards.length > 0) {
        setStatus("success");
      }
    } catch (error) {
      setCards(previousCards);
      persistState(previousCards, nextCursor);
      setStatus("success");
      if (error instanceof ApiError && error.status === 403) {
        setActionError("Please complete all onboarding requirements before browsing.");
      } else {
        setActionError("We couldn’t save your action. Please try again.");
      }
    } finally {
      setPendingAction(null);
    }
  };

  const card = cards[0] ?? null;
  const { scrollYProgress } = useScroll({ container: containerRef, offset: ["start start", "end start"] });
  const photoOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.5]);
  const photoScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  const headerLabel = useMemo(() => {
    if (status === "loading") return "Preparing your Discover feed";
    if (status === "error") return "Unable to load Discover";
    if (status === "empty") return "No profiles right now";
    return null;
  }, [status]);

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
          {status === "success" && card && (
            <div className="relative z-10 w-full">
              <motion.div
                style={{ opacity: photoOpacity, scale: photoScale, transformOrigin: "top center" }}
                className="w-full h-[80vh] overflow-hidden relative shadow-2xl bg-slate-900"
              >
                <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-gradient-to-t from-black/[0.08] to-transparent z-10 pointer-events-none" />
                <img
                  src={card.imageUrl ?? FALLBACK_DISCOVER_IMAGE}
                  alt={card.displayName}
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
                <div className="absolute bottom-10 left-8 z-20">
                  <h1 className="text-6xl font-serif text-white mb-3 drop-shadow-xl tracking-wide">
                    {card.displayName}, <span className="font-light">{card.age}</span>
                  </h1>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.3em] text-white/95 bg-black/30 backdrop-blur-xl w-fit px-4 py-2 rounded-full border border-white/10">
                    <div className="w-2 h-2 rotate-45 bg-primary shadow-[0_0_12px_rgba(200,155,144,0.8)]" />
                    {card.locationLabel || "Private Location"}
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
                    {card.bio ? `"${card.bio}"` : "\"This member prefers to share details gradually.\""}
                  </p>
                </motion.div>
                <div className="grid grid-cols-2 gap-5">
                  <InfoPill icon={Briefcase} text={card.profession ?? "Private Profession"} />
                  <InfoPill icon={Ruler} text={card.heightLabel ?? "Height undisclosed"} />
                </div>
              </div>
            </div>
          )}

          {status !== "success" && (
            <div className="h-[80vh] px-8 pt-24 pb-10 flex flex-col justify-center bg-gradient-to-b from-foreground/[0.04] to-transparent border-b border-border/20">
              <h2 className="text-3xl font-serif text-foreground">{headerLabel}</h2>
              <p className="text-foreground/70 mt-4 text-sm leading-relaxed">
                {status === "loading" && "We are selecting eligible, verified members for your queue."}
                {status === "empty" && "You’ve reviewed all currently eligible members. New introductions will appear soon."}
                {status === "error" && "Please retry in a moment. Your privacy and session remain secure."}
              </p>
              {status === "loading" && <div className="mt-8 h-2 w-40 rounded-full bg-foreground/10 overflow-hidden"><motion.div className="h-full bg-primary/60" animate={{ x: ["-100%", "120%"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} /></div>}
              {status === "error" && (
                <button onClick={() => void (async () => {
                  setStatus("loading");
                  setIsFetching(true);
                  try {
                    const first = await fetchPage();
                    setCards(first.items);
                    setNextCursor(first.nextCursor);
                    persistState(first.items, first.nextCursor);
                    setStatus(first.items.length ? "success" : "empty");
                  } catch {
                    setStatus("error");
                  } finally {
                    setIsFetching(false);
                  }
                })()} className="mt-8 w-fit rounded-full border border-primary/50 px-6 py-2 text-xs uppercase tracking-[0.2em] text-primary hover:bg-primary/10 transition-colors">Retry</button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {actionError && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-1/2 -translate-x-1/2 bottom-36 text-xs tracking-wide text-foreground bg-background/80 border border-border/30 rounded-full px-4 py-2 backdrop-blur-lg z-50">
            {actionError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute left-0 right-0 bottom-10 px-10 flex justify-between items-end z-40 w-full max-w-lg mx-auto pointer-events-none">
        <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} disabled={!card || Boolean(pendingAction) || status !== "success"} onClick={() => void handleInteraction("PASS")} className="w-[76px] h-[76px] rounded-full bg-background/40 backdrop-blur-2xl border border-primary/40 flex items-center justify-center pointer-events-auto relative overflow-hidden group shadow-xl disabled:opacity-40"><div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" /><X size={34} strokeWidth={1} className="text-primary drop-shadow-sm z-10" /></motion.button>
        <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} disabled={!card || Boolean(pendingAction) || status !== "success"} onClick={() => void handleInteraction("LIKE")} className="w-28 h-28 rounded-full bg-background/40 backdrop-blur-3xl shadow-[0_20px_50px_rgba(200,155,144,0.2)] border border-primary/60 flex items-center justify-center pointer-events-auto relative overflow-hidden group disabled:opacity-40"><div className="absolute inset-0 bg-primary/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" /><div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" /><HeartVaelIcon /></motion.button>
      </div>

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

function HeartVaelIcon() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="z-10 drop-shadow-[0_0_15px_rgba(200,155,144,0.4)]"><path d="M12 21C12 21 4.5 14.5 4.5 8.5C4.5 5.5 6.5 3.5 9 3.5C10.5 3.5 11.5 4 12 5C12.5 4 13.5 3.5 15 3.5C17.5 3.5 19.5 5.5 19.5 8.5C19.5 14.5 12 21 12 21Z" stroke="url(#goldGradient)" strokeWidth="1.2" /><defs><linearGradient id="goldGradient" x1="4.5" y1="3.5" x2="19.5" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="var(--primary)" stopOpacity="1" /><stop offset="1" stopColor="var(--highlight)" stopOpacity="0.4" /></linearGradient></defs></svg>;
}
