import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

export type DiscoverCard = {
  id: string;
  userId: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  photo: string;
  verified: boolean;
  premium: boolean;
};

type SwipeType = "LIKE" | "PASS";

type DiscoverFeedResponse = {
  items?: Array<any>;
  nextCursor?: string;
};

const BATCH_SIZE = 20;
const LOW_WATERMARK = 5;
const MAX_RETRY_ATTEMPTS = 5;

function toCard(item: any): DiscoverCard {
  return {
    id: item.userId,
    userId: item.userId,
    name: item.name ?? "Member",
    age: Number(item.age ?? 18),
    city: item.city ?? "",
    bio: item.bioShort ?? "",
    photo: item.primaryPhotoUrl ?? "",
    verified: item.videoVerificationStatus === "APPROVED",
    premium: false,
  };
}

function computeBackoffMs(attempt: number) {
  const base = Math.min(1000 * 2 ** Math.max(0, attempt - 1), 30_000);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

export function useDiscoverBuffer(options: { intent: string; distance: number; selectedInterests: string[] }) {
  const { intent, distance, selectedInterests } = options;
  const [buffer, setBuffer] = useState<DiscoverCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [syncWarning, setSyncWarning] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const cursorRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);
  const queuedSwipesRef = useRef<Array<{ actionId: string; toUserId: string; type: SwipeType; attempts: number; nextAttemptAt: number }>>([]);
  const knownActionIdsRef = useRef(new Set<string>());
  const processingQueueRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightFetchRef = useRef(false);

  const interestQuery = useMemo(
    () =>
      selectedInterests.length
        ? `&interests=${encodeURIComponent(selectedInterests.join(","))}`
        : "",
    [selectedInterests]
  );

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const processSwipeQueue = useCallback(async () => {
    if (processingQueueRef.current) return;
    processingQueueRef.current = true;
    clearRetryTimer();

    try {
      while (queuedSwipesRef.current.length) {
        const now = Date.now();
        const next = queuedSwipesRef.current[0];
        if (next.nextAttemptAt > now) {
          retryTimerRef.current = setTimeout(() => {
            void processSwipeQueue();
          }, next.nextAttemptAt - now);
          return;
        }

        try {
          await apiFetch("/likes", {
            method: "POST",
            retryOnUnauthorized: true,
            body: { toUserId: next.toUserId, type: next.type } as never,
          });
          const processed = queuedSwipesRef.current.shift();
          if (processed) {
            knownActionIdsRef.current.delete(processed.actionId);
          }
          setAuthRequired(false);
          if (queuedSwipesRef.current.length === 0) {
            setSyncWarning(false);
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            const unauthorized = queuedSwipesRef.current.shift();
            if (unauthorized) {
              knownActionIdsRef.current.delete(unauthorized.actionId);
            }
            setAuthRequired(true);
            setSyncWarning(false);
            continue;
          }

          next.attempts += 1;
          if (next.attempts >= MAX_RETRY_ATTEMPTS) {
            const dropped = queuedSwipesRef.current.shift();
            if (dropped) {
              knownActionIdsRef.current.delete(dropped.actionId);
            }
          } else {
            next.nextAttemptAt = now + computeBackoffMs(next.attempts);
          }
          setSyncWarning(true);
        }
      }
    } finally {
      processingQueueRef.current = false;
    }
  }, [clearRetryTimer]);

  const enqueueSwipe = useCallback(
    (payload: { actionId: string; toUserId: string; type: SwipeType }) => {
      if (knownActionIdsRef.current.has(payload.actionId)) {
        return;
      }
      knownActionIdsRef.current.add(payload.actionId);
      queuedSwipesRef.current.push({ ...payload, attempts: 0, nextAttemptAt: Date.now() });
      void processSwipeQueue();
    },
    [processSwipeQueue]
  );

  const fetchBatch = useCallback(
    async (opts?: { reset?: boolean }) => {
      if (inFlightFetchRef.current) return;
      if (!opts?.reset && !hasMoreRef.current) return;
      inFlightFetchRef.current = true;
      if (opts?.reset) {
        setLoading(true);
        setError(false);
      }

      const targetCursor = opts?.reset ? undefined : cursorRef.current;
      const cursorQuery = targetCursor ? `&cursor=${encodeURIComponent(targetCursor)}` : "";

      try {
        const data = await apiFetch<DiscoverFeedResponse>(
          `/discover/feed?intent=${intent}&distance=${distance}&limit=${BATCH_SIZE}${cursorQuery}${interestQuery}`
        );
        const items = Array.isArray(data?.items) ? data.items.map(toCard) : [];
        const nextCursor = typeof data?.nextCursor === "string" && data.nextCursor.length > 0 ? data.nextCursor : undefined;

        cursorRef.current = nextCursor;
        hasMoreRef.current = Boolean(nextCursor);
        setHasMore(hasMoreRef.current);

        setBuffer((prev) => {
          const existing = new Set((opts?.reset ? [] : prev).map((profile) => profile.userId));
          const merged = opts?.reset ? [] : [...prev];
          for (const item of items) {
            if (!existing.has(item.userId)) {
              merged.push(item);
              existing.add(item.userId);
            }
          }
          return merged;
        });
      } catch {
        setError(true);
      } finally {
        if (opts?.reset) {
          setLoading(false);
        }
        inFlightFetchRef.current = false;
      }
    },
    [intent, distance, interestQuery]
  );

  useEffect(() => {
    setBuffer([]);
    cursorRef.current = undefined;
    hasMoreRef.current = true;
    setHasMore(true);
    setError(false);
    void fetchBatch({ reset: true });
  }, [intent, distance, interestQuery, fetchBatch]);

  useEffect(() => {
    if (!loading && buffer.length < LOW_WATERMARK && hasMoreRef.current) {
      void fetchBatch();
    }
  }, [buffer.length, loading, fetchBatch]);

  useEffect(() => {
    return () => {
      clearRetryTimer();
    };
  }, [clearRetryTimer]);

  const advance = useCallback(
    (options: { actionId: string; type: SwipeType }) => {
      const nextCard = buffer[0];
      if (!nextCard) return null;
      setBuffer((prev) => prev.slice(1));
      enqueueSwipe({ actionId: options.actionId, toUserId: nextCard.userId, type: options.type });
      return nextCard;
    },
    [buffer, enqueueSwipe]
  );

  return {
    buffer,
    currentCard: buffer[0] ?? null,
    loading,
    error,
    syncWarning,
    authRequired,
    hasMore,
    batchSize: BATCH_SIZE,
    lowWatermark: LOW_WATERMARK,
    advance,
    reload: () => fetchBatch({ reset: true }),
  };
}
