"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ApiError, apiRequestAuth } from "@/lib/api";
import { fetchAlerts, type Alert } from "@/lib/queries";
import { useStaleWhileRevalidate } from "@/lib/cache";
import { Bell, Heart, MapPin, Phone, Sparkles, Share2, Video, MessageSquareText, type LucideIcon } from "lucide-react";

function relativeTimeFromNow(isoOrDate: string): string {
  const ts = new Date(isoOrDate).getTime();
  const diffMs = Date.now() - ts;
  if (!Number.isFinite(diffMs)) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds <= 0 ? 0 : seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function iconForAlertType(type: string): { Icon: LucideIcon; accentClass: string } {
  switch (type) {
    case "LIKE_RECEIVED":
      return { Icon: Heart, accentClass: "text-primary" };
    case "MATCH_CREATED":
      return { Icon: Sparkles, accentClass: "text-primary" };
    case "INTERACTION_REQUEST_RECEIVED":
      return { Icon: MessageSquareText, accentClass: "text-primary" };
    case "OFFLINE_MEET_OPTIONS_SENT":
    case "OFFLINE_MEET_TIMEOUT":
    case "OFFLINE_MEET_NO_OVERLAP":
    case "OFFLINE_MEET_FINALIZED":
    case "OFFLINE_MEET_ACCEPTED":
      return { Icon: MapPin, accentClass: "text-highlight" };
    case "ONLINE_MEET_OPTIONS_SENT":
    case "ONLINE_MEET_TIMEOUT":
    case "ONLINE_MEET_NO_OVERLAP":
    case "ONLINE_MEET_FINALIZED":
    case "ONLINE_MEET_ACCEPTED":
      return { Icon: Video, accentClass: "text-highlight" };
    case "SOCIAL_EXCHANGE_REQUEST":
    case "SOCIAL_EXCHANGE_READY":
    case "SOCIAL_EXCHANGE_EXPIRED":
      return { Icon: Share2, accentClass: "text-highlight" };
    case "PHONE_EXCHANGE_REQUEST":
    case "PHONE_EXCHANGE_CONFIRMED":
    case "PHONE_EXCHANGE_REVEALED":
      return { Icon: Phone, accentClass: "text-highlight" };
    default:
      return { Icon: Bell, accentClass: "text-foreground/60" };
  }
}

export default function AlertsPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [markAllPending, setMarkAllPending] = useState(false);

  const alertsQuery = useStaleWhileRevalidate({
    key: "alerts",
    fetcher: fetchAlerts,
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    staleTimeMs: 30_000
  });

  useLiveResourceRefresh({
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    refresh: () => alertsQuery.refresh(true),
    fallbackIntervalMs: 60_000
  });

  const alerts = alertsQuery.data ?? [];
  const unreadCount = useMemo(() => alerts.filter((item) => item.isUnread).length, [alerts]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  const markSingleRead = async (alertId: string) => {
    if (pendingIds.has(alertId)) return;
    const previous = alertsQuery.data;

    setPendingIds((current) => new Set(current).add(alertId));
    alertsQuery.mutate((current) => (current ?? []).map((entry) => (entry.id === alertId ? { ...entry, isUnread: false } : entry)));

    try {
      await apiRequestAuth(`/alerts/${alertId}/read`, { method: "POST" });
    } catch (error) {
      alertsQuery.mutate(previous ?? []);
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(alertId);
        return next;
      });
    }
  };

  const markAllRead = async () => {
    if (markAllPending || unreadCount === 0) return;
    const previous = alertsQuery.data;
    setMarkAllPending(true);
    alertsQuery.mutate((current) => (current ?? []).map((entry) => ({ ...entry, isUnread: false })));
    try {
      await apiRequestAuth("/alerts/read-all", { method: "POST" });
    } catch (_error) {
      alertsQuery.mutate(previous ?? []);
    } finally {
      setMarkAllPending(false);
    }
  };

  const handleAlertClick = async (alert: Alert) => {
    if (alert.isUnread) {
      await markSingleRead(alert.id);
    }

    if (typeof alert.deepLinkUrl === "string" && alert.deepLinkUrl.startsWith("/")) {
      router.push(alert.deepLinkUrl);
      return;
    }
    router.push("/matches");
  };

  const isInitialLoading = alertsQuery.isLoading && alerts.length === 0;
  const errorMessage = alertsQuery.error instanceof ApiError ? alertsQuery.error.message : "We couldn’t load your alerts.";

  return (
    <div className="w-full h-full relative">
      <div className="w-full pt-8 pb-4 flex flex-col items-center justify-center px-6 gap-2">
        <h1 className="text-xl tracking-[0.4em] font-medium text-primary drop-shadow-sm uppercase">Alerts</h1>
        {unreadCount > 0 ? (
          <button
            onClick={markAllRead}
            disabled={markAllPending}
            className="text-xs text-primary/80 hover:text-primary transition disabled:opacity-50"
          >
            {markAllPending ? "Updating…" : `Mark all as read (${unreadCount})`}
          </button>
        ) : null}
      </div>

      <div className="w-full px-4 pt-4 pb-20 flex flex-col gap-3">
        {isInitialLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="w-full p-5 rounded-[2rem] border border-white/10 bg-white/[0.02] animate-pulse h-[92px]" />
            ))}
          </div>
        )}

        {!!alertsQuery.error && !isInitialLoading && (
  <div className="rounded-3xl border border-red-200/20 bg-red-950/10 p-6 text-center">
    <p className="text-sm text-foreground/80">{errorMessage}</p>
    <button onClick={() => alertsQuery.revalidate()} className="mt-4 text-xs text-primary hover:text-primary/80 transition">
      Retry
    </button>
  </div>
)}

        {!alertsQuery.error && !isInitialLoading && alerts.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-foreground/70">No alerts yet. Important membership and coordination updates will appear here.</p>
          </div>
        )}

        {!alertsQuery.error &&
          alerts.map((alert, index) => {
            const { Icon, accentClass } = iconForAlertType(alert.type);
            return (
              <motion.button
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAlertClick(alert)}
                className={`w-full text-left p-5 rounded-[2rem] border transition-all flex items-start gap-4 ${
                  alert.isUnread ? "bg-primary/5 border-primary/20 shadow-md" : "bg-transparent border-transparent hover:bg-primary/5"
                }`}
              >
                <div className={`w-11 h-11 rounded-[1.1rem] border flex items-center justify-center ${accentClass} border-primary/20 bg-background/40`}>
                  <Icon size={18} strokeWidth={2} />
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  <div className="flex justify-between items-start w-full gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-foreground text-[16px] truncate font-bold">{alert.title}</h3>
                        {alert.isUnread ? <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.55)]" /> : null}
                      </div>
                      <p className={`mt-2 text-[13px] leading-relaxed truncate ${alert.isUnread ? "text-foreground" : "text-foreground/60 font-light"}`}>{alert.body}</p>
                    </div>

                    <span className="text-[10px] text-foreground/30 tracking-widest font-bold shrink-0 uppercase">
                      {relativeTimeFromNow(alert.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
      </div>
    </div>
  );
}
