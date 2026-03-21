"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLiveEventSubscription, useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import { Briefcase, Ruler, X, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { normalizeApiError } from "@/lib/apiErrors";
import { sendLikeAction } from "@/lib/likes";
import { fetchDiscoverFeedPageWithFilters, mapLegacyFeedItemToCard } from "@/lib/queries";
import {
  applyDiscoverActionToState,
  mergeDiscoverFeedPage,
  readDiscoverFeedState,
  replaceDiscoverFeedPage,
  writeDiscoverFeedState,
  type DiscoverFeedState,
  type DiscoverFilters
} from "@/lib/discoverFeed";
import {
  DISCOVER_BACKGROUND_SYNC_INTERVAL_MS,
  removeIncomingLikeFromCache,
  syncAfterMatchCreated
} from "@/lib/resourceSync";

type PageStatus = "loading" | "success" | "empty" | "error";
type PendingAction = { id: string; action: "LIKE" | "PASS" };

function buildActionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `discover-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

const BUFFER_TARGET = 10;
const REFILL_THRESHOLD = 4;
const FALLBACK_DISCOVER_IMAGE = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=2127&auto=format&fit=crop";

function preloadImage(url: string | null | undefined) {
  if (!url || typeof window === "undefined") return;
  const image = new Image();
  image.decoding = "async";
  image.src = url;
}

function toDraftAge(value: number | undefined) {
  return typeof value === "number" ? String(value) : "";
}

export default function DiscoverPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialFeedState = useMemo(() => readDiscoverFeedState(), []);
  const feedStateRef = useRef<DiscoverFeedState>(initialFeedState);
  const backgroundSyncRef = useRef<Promise<void> | null>(null);

  const [hasScrolled, setHasScrolled] = useState(false);
  const [feedState, setFeedState] = useState<DiscoverFeedState>(initialFeedState);
  const [isFetching, setIsFetching] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [status, setStatus] = useState<PageStatus>(initialFeedState.cards.length ? "success" : "loading");

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftCity, setDraftCity] = useState(initialFeedState.filters.city ?? "");
  const [draftAge, setDraftAge] = useState(toDraftAge(initialFeedState.filters.age));

  useEffect(() => {
    feedStateRef.current = feedState;
  }, [feedState]);

  const persistFeedState = useCallback((updater: DiscoverFeedState | ((current: DiscoverFeedState) => DiscoverFeedState)) => {
    setFeedState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      const persisted = writeDiscoverFeedState(next);
      feedStateRef.current = persisted;
      return persisted;
    });
  }, []);

  const cards = feedState.cards;
  const nextCursor = feedState.nextCursor;
  const appliedFilters = feedState.filters;

  const fetchPage = useCallback(
    async (cursor?: string, overrideFilters?: DiscoverFilters) => {
      const filters = overrideFilters ?? feedStateRef.current.filters;
      const response = await fetchDiscoverFeedPageWithFilters(cursor, BUFFER_TARGET, filters);
      return {
        items: response.items.map(mapLegacyFeedItemToCard),
        nextCursor: response.nextCursor
      };
    },
    []
  );

  const refillBuffer = useCallback(async () => {
    const cursor = feedStateRef.current.nextCursor;
    if (isFetching || !cursor) return;

    setIsFetching(true);
    try {
      const next = await fetchPage(cursor);
      persistFeedState((current) => mergeDiscoverFeedPage(current, next.items, next.nextCursor));
      const updated = feedStateRef.current;
      if (updated.cards.length > 0) {
        setStatus("success");
      } else {
        setStatus("empty");
      }
    } finally {
      setIsFetching(false);
    }
  }, [fetchPage, isFetching, persistFeedState]);

  const loadFirstPage = useCallback(async (filters?: DiscoverFilters, options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading !== false;
    const hadCards = feedStateRef.current.cards.length > 0;

    if (showLoading) {
      setStatus("loading");
    }
    setIsFetching(true);

    try {
      const nextFilters = filters ?? feedStateRef.current.filters;
      const first = await fetchPage(undefined, nextFilters);
      persistFeedState((current) => replaceDiscoverFeedPage(current, first.items, first.nextCursor, nextFilters));
      const updated = feedStateRef.current;
      setStatus(updated.cards.length ? "success" : "empty");
    } catch {
      if (showLoading || !hadCards) {
        setStatus("error");
      }
    } finally {
      setIsFetching(false);
    }
  }, [fetchPage, persistFeedState]);

  const syncFromTail = useCallback(async () => {
    if (isFetching || backgroundSyncRef.current) {
      return backgroundSyncRef.current ?? undefined;
    }

    const current = feedStateRef.current;
    backgroundSyncRef.current = (async () => {
      try {
        if (current.cards.length === 0) {
          await loadFirstPage(current.filters, { showLoading: false });
          return;
        }

        const tailCursor = current.cards[current.cards.length - 1]?.id;
        if (!tailCursor) return;

        const next = await fetchPage(tailCursor, current.filters);
        if (next.items.length === 0 && !next.nextCursor) return;

        persistFeedState((state) => mergeDiscoverFeedPage(state, next.items, state.nextCursor ?? next.nextCursor));
        if (feedStateRef.current.cards.length > 0) {
          setStatus("success");
        }
      } catch {
        // Keep the current queue visible if a silent tail sync fails.
      } finally {
        backgroundSyncRef.current = null;
      }
    })();

    return backgroundSyncRef.current;
  }, [fetchPage, isFetching, loadFirstPage, persistFeedState]);

  const applyFilters = async () => {
    const nextCity = draftCity.trim() ? draftCity.trim() : undefined;
    const parsedAge = draftAge.trim() ? Number(draftAge.trim()) : NaN;
    const nextAge = Number.isFinite(parsedAge) ? parsedAge : undefined;

    setFilterOpen(false);
    await loadFirstPage({ city: nextCity, age: nextAge });
  };

  const clearFilters = async () => {
    setDraftCity("");
    setDraftAge("");
    setFilterOpen(false);
    await loadFirstPage({});
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!isAuthenticated || onboardingStep !== "COMPLETED") return;
      if (feedStateRef.current.cards.length > 0) {
        setStatus("success");
        if (feedStateRef.current.nextCursor) {
          void refillBuffer();
        } else {
          void syncFromTail();
        }
        return;
      }
      await loadFirstPage(feedStateRef.current.filters);
    };

    void bootstrap();
  }, [isAuthenticated, loadFirstPage, onboardingStep, refillBuffer, syncFromTail]);

  useEffect(() => {
    if (status === "success" && cards.length <= REFILL_THRESHOLD && nextCursor) {
      void refillBuffer();
    }
    cards.slice(1, 4).forEach((card) => preloadImage(card.imageUrl));
  }, [cards, nextCursor, refillBuffer, status]);

  useLiveResourceRefresh({
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    refresh: async () => {
      const current = feedStateRef.current;
      if (current.nextCursor && current.cards.length <= REFILL_THRESHOLD) {
        await refillBuffer();
        return;
      }
      await syncFromTail();
    },
    fallbackIntervalMs: DISCOVER_BACKGROUND_SYNC_INTERVAL_MS
  });

  useLiveEventSubscription(["discover.action_applied"], () => {
    const next = readDiscoverFeedState();
    feedStateRef.current = next;
    setFeedState(next);
    if (next.cards.length === 0 && !next.nextCursor) {
      setStatus("empty");
    } else if (next.cards.length > 0) {
      setStatus("success");
    }
  }, isAuthenticated && onboardingStep === "COMPLETED");

  const handleInteraction = async (action: "LIKE" | "PASS") => {
    const current = feedStateRef.current.cards[0];
    if (!current || pendingAction) return;

    const actionId = buildActionId();
    const previousState = feedStateRef.current;
    setPendingAction({ id: actionId, action });
    setActionError(null);

    persistFeedState((state) => applyDiscoverActionToState(state, current.id));
    removeIncomingLikeFromCache(current.id);
    const optimisticState = feedStateRef.current;
    if (optimisticState.cards.length === 0 && !optimisticState.nextCursor) {
      setStatus("empty");
    }

    try {
      const response = await sendLikeAction({ actionId, targetUserId: current.id, action });
      if (response.matchId) {
        void syncAfterMatchCreated(response.matchId);
      }
      if (feedStateRef.current.cards.length > 0) {
        setStatus("success");
      }
    } catch (error) {
      persistFeedState(previousState);
      setStatus(previousState.cards.length ? "success" : "empty");
      const normalized = normalizeApiError(error);
      setActionError(normalized.message);
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
                <button onClick={() => void loadFirstPage()} className="mt-8 w-fit rounded-full border border-primary/50 px-6 py-2 text-xs uppercase tracking-[0.2em] text-primary hover:bg-primary/10 transition-colors">Retry</button>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setDraftCity(appliedFilters.city ?? "");
          setDraftAge(toDraftAge(appliedFilters.age));
          setFilterOpen(true);
        }}
        className="absolute top-5 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 backdrop-blur-lg px-3 py-2 text-xs uppercase tracking-[0.15em] text-primary hover:bg-primary/10 transition-colors"
      >
        <SlidersHorizontal size={16} strokeWidth={1.8} />
        <span className="leading-none">Filter</span>
      </button>

      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setFilterOpen(false);
            }}
          >
            <div className="w-full h-full flex items-end sm:items-center justify-center p-5">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="w-full max-w-md rounded-3xl border border-border/30 bg-background/95 p-5 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm uppercase tracking-[0.2em] text-foreground/60 font-medium">Discover filters</h3>
                    <p className="text-sm text-foreground/70 mt-2">Choose age (min) and city to refine the queue.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="w-10 h-10 rounded-full border border-border/30 bg-background/70 flex items-center justify-center hover:bg-foreground/5 transition-colors"
                    aria-label="Close filters"
                  >
                    <X size={18} strokeWidth={1.8} className="text-foreground/70" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-[0.18em] text-foreground/60">Age (min)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={18}
                      step={1}
                      value={draftAge}
                      onChange={(e) => setDraftAge(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full rounded-xl border border-border/30 bg-background/70 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-[0.18em] text-foreground/60">City</label>
                    <input
                      type="text"
                      value={draftCity}
                      onChange={(e) => setDraftCity(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="w-full rounded-xl border border-border/30 bg-background/70 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void clearFilters()}
                    className="flex-1 rounded-xl border border-border/40 bg-background/70 px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground/70 hover:bg-foreground/5 transition-colors"
                    disabled={status === "loading" || isFetching}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => void applyFilters()}
                    className="flex-1 btn-vael-primary px-4 py-2 text-xs uppercase tracking-[0.15em] disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={status === "loading" || isFetching}
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
