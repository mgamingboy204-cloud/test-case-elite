"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ApiError, apiRequestAuth } from "@/lib/api";
import { fetchAlerts, type Alert } from "@/lib/queries";
import { useStaleWhileRevalidate } from "@/lib/cache";

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

  const alerts = alertsQuery.data ?? [];
  const unreadCount = useMemo(() => alerts.filter((item) => item.isUnread).length, [alerts]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  const markSingleRead = async (alertId: string) => {
    if (pendingIds.has(alertId)) return;
    const previous = alertsQuery.data;

    setPendingIds((current) => new Set(current).add(alertId));
    alertsQuery.mutate((current) => (current ?? []).map((entry) => (entry.id === alertId ? { ...entry, isUnread: false } : entry)));

    try {
      await apiRequestAuth("/notifications/read", {
        method: "PATCH",
        body: JSON.stringify({ ids: [alertId] })
      });
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
      await apiRequestAuth("/notifications/read", { method: "PATCH", body: JSON.stringify({}) });
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

    if (alert.type === "INTEREST") router.push("/likes");
    else router.push("/matches");
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

        {!alertsQuery.error && alerts.map((alert, index) => (
          <motion.button
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAlertClick(alert)}
            className={`w-full text-left p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${
              alert.isUnread ? "bg-primary/5 border-primary/20 shadow-md" : "bg-transparent border-transparent hover:bg-primary/5"
            }`}
          >
            <img src={alert.image} alt="Alert" className="w-14 h-14 rounded-[1rem] object-cover border border-white/10 shadow-sm" />

            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
              <div className="flex justify-between items-center w-full gap-2">
                <h3 className="font-serif text-foreground text-[16px] truncate">{alert.title}</h3>
                <span className="text-[10px] text-foreground/30 tracking-widest font-bold shrink-0 uppercase">{alert.timestamp}</span>
              </div>
              <p className={`text-[13px] leading-relaxed truncate ${alert.isUnread ? "text-primary" : "text-foreground/60 font-light"}`}>{alert.message}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
