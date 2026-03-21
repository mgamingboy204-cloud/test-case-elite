"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL, refreshAccessToken } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { applyDiscoverActionToCache } from "@/lib/discoverFeed";
import { primeCache } from "@/lib/cache";
import { getAccessToken } from "@/lib/auth/tokenService";
import { getMemberResourceConfig, getMemberResourceNameForLiveEvent } from "@/lib/resourceSync";

type LiveConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "offline";

type LiveEventPayloadMap = {
  "alerts.changed": { userIds: string[] };
  "likes.changed": { userIds: string[] };
  "matches.changed": { userIds: string[] };
  "profile.changed": { userIds: string[] };
  "session.state.changed": { userIds: string[]; reason: string };
  "discover.action_applied": { userId: string; targetUserId: string; action: "LIKE" | "PASS" };
  "verification.status.changed": { userId: string; requestId: string; status: string };
  "admin.verification.queue.changed": { requestId: string | null };
  "admin.offline_meets.changed": { caseId: string | null };
  "admin.online_meets.changed": { caseId: string | null };
  "admin.dashboard.changed": Record<string, never>;
};

export type LiveEventType = keyof LiveEventPayloadMap;

export type LiveEvent<TType extends LiveEventType = LiveEventType> = TType extends LiveEventType
  ? {
      id: string;
      type: TType;
      timestamp: string;
      payload: LiveEventPayloadMap[TType];
    }
  : never;

type LiveUpdatesContextValue = {
  connectionState: LiveConnectionState;
  subscribe: (listener: (event: LiveEvent) => void) => () => void;
};

const LiveUpdatesContext = createContext<LiveUpdatesContextValue | undefined>(undefined);
const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 20_000];

function resolveRetryDelay(attempt: number) {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
}

async function parseSseStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (eventName: string | null, data: string) => void
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const delimiterIndex = buffer.indexOf("\n\n");
      if (delimiterIndex === -1) break;

      const chunk = buffer.slice(0, delimiterIndex);
      buffer = buffer.slice(delimiterIndex + 2);

      let eventName: string | null = null;
      const dataLines: string[] = [];

      for (const rawLine of chunk.split(/\r?\n/)) {
        const line = rawLine.trimEnd();
        if (!line || line.startsWith(":")) continue;
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
          continue;
        }
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (dataLines.length > 0) {
        onEvent(eventName, dataLines.join("\n"));
      }
    }
  }
}

export function LiveUpdatesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthResolved, refreshCurrentUser } = useAuth();
  const [connectionState, setConnectionState] = useState<LiveConnectionState>("idle");
  const listenersRef = useRef(new Set<(event: LiveEvent) => void>());
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resourceRefreshesRef = useRef(new Map<string, Promise<void>>());
  const sessionRefreshRef = useRef<Promise<void> | null>(null);

  const subscribe = useCallback((listener: (event: LiveEvent) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const refreshResource = useCallback(async (key: string, fetcher: () => Promise<unknown>) => {
    const pending = resourceRefreshesRef.current.get(key);
    if (pending) return pending;

    const next = (async () => {
      try {
        const value = await fetcher();
        primeCache(key, value);
      } catch {
        // Best-effort live refresh.
      } finally {
        resourceRefreshesRef.current.delete(key);
      }
    })();

    resourceRefreshesRef.current.set(key, next);
    return next;
  }, []);

  const refreshSessionState = useCallback(async () => {
    if (sessionRefreshRef.current) return sessionRefreshRef.current;

    sessionRefreshRef.current = (async () => {
      try {
        await refreshCurrentUser();
      } catch {
        // Session/auth cleanup is handled elsewhere.
      } finally {
        sessionRefreshRef.current = null;
      }
    })();

    return sessionRefreshRef.current;
  }, [refreshCurrentUser]);

  const dispatchEvent = useCallback((event: LiveEvent) => {
    if (event.type === "discover.action_applied") {
      applyDiscoverActionToCache(event.payload.targetUserId);
    } else if (event.type === "session.state.changed") {
      void refreshSessionState();
    } else {
      const resourceName = getMemberResourceNameForLiveEvent(event.type);
      if (resourceName) {
        const config = getMemberResourceConfig(resourceName);
        void refreshResource(config.cacheKey, config.fetcher);
      }
    }

    for (const listener of listenersRef.current) {
      try {
        listener(event);
      } catch {
        // Ignore listener failures so one screen cannot break the live bus.
      }
    }
  }, [refreshResource, refreshSessionState]);

  useEffect(() => {
    if (!isAuthResolved) return;

    if (!isAuthenticated) {
      setConnectionState("idle");
      abortRef.current?.abort();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      reconnectAttemptRef.current = 0;
      return;
    }

    let closed = false;

    const clearReconnectTimer = () => {
      if (!reconnectTimerRef.current) return;
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    };

    const scheduleReconnect = () => {
      if (closed) return;
      clearReconnectTimer();
      const attempt = reconnectAttemptRef.current;
      const delay = resolveRetryDelay(attempt);
      reconnectAttemptRef.current += 1;
      setConnectionState("offline");
      reconnectTimerRef.current = setTimeout(() => {
        void connect(attempt > 0);
      }, delay);
    };

    const connect = async (isReconnect: boolean) => {
      if (closed) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setConnectionState(isReconnect ? "reconnecting" : "connecting");

      let token = getAccessToken();
      if (!token) {
        const refreshResult = await refreshAccessToken({ allowMissingSession: true });
        if (refreshResult !== "success") {
          scheduleReconnect();
          return;
        }
        token = getAccessToken();
      }

      if (!token) {
        scheduleReconnect();
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.live.stream}`, {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`
          },
          cache: "no-store",
          credentials: "include",
          signal: controller.signal
        });

        if (response.status === 401) {
          const refreshResult = await refreshAccessToken({ allowMissingSession: true });
          if (refreshResult === "success") {
            void connect(true);
            return;
          }
          scheduleReconnect();
          return;
        }

        if (!response.ok || !response.body) {
          scheduleReconnect();
          return;
        }

        reconnectAttemptRef.current = 0;
        clearReconnectTimer();
        setConnectionState("connected");

        await parseSseStream(response.body, (eventName, data) => {
          if (eventName === "ping" || eventName === "connected") return;
          try {
            dispatchEvent(JSON.parse(data) as LiveEvent);
          } catch {
            // Ignore malformed live payloads.
          }
        });

        if (!closed && !controller.signal.aborted) {
          scheduleReconnect();
        }
      } catch {
        if (!closed && !controller.signal.aborted) {
          scheduleReconnect();
        }
      }
    };

    void connect(false);

    return () => {
      closed = true;
      abortRef.current?.abort();
      clearReconnectTimer();
    };
  }, [dispatchEvent, isAuthenticated, isAuthResolved]);

  const value = useMemo(() => ({ connectionState, subscribe }), [connectionState, subscribe]);

  return <LiveUpdatesContext.Provider value={value}>{children}</LiveUpdatesContext.Provider>;
}

export function useLiveUpdates() {
  const context = useContext(LiveUpdatesContext);
  if (!context) {
    throw new Error("useLiveUpdates must be used within a LiveUpdatesProvider");
  }
  return context;
}

export function useLiveEventSubscription(
  eventTypes: LiveEventType[],
  handler: (event: LiveEvent) => void,
  enabled = true
) {
  const { subscribe } = useLiveUpdates();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || eventTypes.length === 0) return undefined;
    const allowed = new Set(eventTypes);
    return subscribe((event) => {
      if (!allowed.has(event.type)) return;
      handlerRef.current(event);
    });
  }, [enabled, eventTypes, subscribe]);
}

export function useLiveResourceRefresh(options: {
  enabled: boolean;
  refresh: () => Promise<unknown> | unknown;
  eventTypes?: LiveEventType[];
  fallbackIntervalMs?: number;
  refreshOnForeground?: boolean;
}) {
  const { connectionState } = useLiveUpdates();
  const refreshRef = useRef(options.refresh);
  const inFlightRefreshRef = useRef<Promise<unknown> | null>(null);

  useEffect(() => {
    refreshRef.current = options.refresh;
  }, [options.refresh]);

  const invokeRefresh = useCallback(() => {
    if (inFlightRefreshRef.current) return inFlightRefreshRef.current;

    const next = Promise.resolve(refreshRef.current()).finally(() => {
      inFlightRefreshRef.current = null;
    });

    inFlightRefreshRef.current = next;
    return next;
  }, []);

  useLiveEventSubscription(
    options.eventTypes ?? [],
    () => {
      void invokeRefresh();
    },
    options.enabled
  );

  useEffect(() => {
    if (!options.enabled) return;
    if (connectionState !== "connected") return;
    void invokeRefresh();
  }, [connectionState, invokeRefresh, options.enabled]);

  useEffect(() => {
    if (!options.enabled) return;
    if (options.refreshOnForeground === false) return;

    const refreshOnResume = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void invokeRefresh();
    };

    const refreshOnVisible = () => {
      if (document.visibilityState !== "visible") return;
      void invokeRefresh();
    };

    window.addEventListener("focus", refreshOnResume);
    window.addEventListener("online", refreshOnResume);
    document.addEventListener("visibilitychange", refreshOnVisible);

    return () => {
      window.removeEventListener("focus", refreshOnResume);
      window.removeEventListener("online", refreshOnResume);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, [invokeRefresh, options.enabled, options.refreshOnForeground]);

  useEffect(() => {
    if (!options.enabled || !options.fallbackIntervalMs) return;
    if (connectionState === "connected") return;

    const id = window.setInterval(() => {
      void invokeRefresh();
    }, options.fallbackIntervalMs);

    return () => window.clearInterval(id);
  }, [connectionState, invokeRefresh, options.enabled, options.fallbackIntervalMs]);
}
