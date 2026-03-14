"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { Bell, Heart, Sparkles } from "lucide-react";

type BackendNotification = {
  id: string;
  type: "NEW_LIKE" | "NEW_MATCH" | "VIDEO_VERIFICATION_UPDATE" | string;
  eventCategory?: "LIKE" | "MATCH" | "SYSTEM" | string;
  eventMessage?: string;
  targetRoute?: string;
  isRead: boolean;
  createdAt: string;
  actorPreview?: {
    actorName?: string;
    actorImageUrl?: string | null;
  };
  actor?: {
    profile?: { name?: string } | null;
    photos?: Array<{ url: string }>;
  } | null;
};

interface Alert {
  id: string;
  type: "LIKE" | "MATCH" | "SYSTEM";
  title: string;
  message: string;
  timestamp: string;
  image: string;
  isUnread: boolean;
  targetRoute: string;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80";

function formatRelativeTime(isoDate: string) {
  const timestamp = new Date(isoDate).getTime();
  if (!Number.isFinite(timestamp)) return "recent";
  const diffMs = Date.now() - timestamp;

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

function mapType(item: BackendNotification): Alert["type"] {
  if (item.eventCategory === "LIKE" || item.type === "NEW_LIKE") return "LIKE";
  if (item.eventCategory === "MATCH" || item.type === "NEW_MATCH") return "MATCH";
  return "SYSTEM";
}

export default function AlertsPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/signin");
    else if (onboardingStep !== "COMPLETED") router.replace("/onboarding/verification");
  }, [isAuthenticated, onboardingStep, router]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!isAuthenticated || onboardingStep !== "COMPLETED") return;

      const response = await apiRequest<{ notifications: BackendNotification[] }>("/notifications", { auth: true });
      setAlerts(
        response.notifications.map((item) => {
          const type = mapType(item);
          const actorName = item.actorPreview?.actorName ?? item.actor?.profile?.name ?? "Someone";
          const actorImage = item.actorPreview?.actorImageUrl ?? item.actor?.photos?.[0]?.url ?? FALLBACK_IMAGE;

          const title =
            type === "LIKE"
              ? "New Like"
              : type === "MATCH"
                ? "New Match"
                : "System Update";

          const message =
            item.eventMessage ??
            (type === "LIKE"
              ? `${actorName} liked you`
              : type === "MATCH"
                ? `${actorName} matched with you`
                : "You have a new system update");

          const targetRoute =
            item.targetRoute ??
            (type === "LIKE" ? "/likes" : type === "MATCH" ? "/matches" : "/profile");

          return {
            id: item.id,
            type,
            title,
            message,
            timestamp: formatRelativeTime(item.createdAt),
            image: actorImage,
            isUnread: !item.isRead,
            targetRoute
          };
        })
      );
    };

    void loadNotifications();
  }, [isAuthenticated, onboardingStep]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  const handleAlertClick = async (alert: Alert) => {
    if (alert.isUnread) {
      setAlerts((prev) => prev.map((item) => (item.id === alert.id ? { ...item, isUnread: false } : item)));
      try {
        await apiRequest(`/notifications/${alert.id}/read`, {
          method: "PATCH",
          auth: true
        });
      } catch {
        // Keep optimistic read-state for smooth UX.
      }
    }

    router.push(alert.targetRoute);
  };

  return (
    <div className="w-full h-full relative">
      <div className="w-full pt-8 pb-4 flex flex-col items-center justify-center px-6">
        <h1 className="text-xl tracking-[0.4em] font-medium text-primary drop-shadow-sm uppercase">Alerts</h1>
      </div>

      <div className="w-full px-4 pt-4 pb-20 flex flex-col gap-3">
        {alerts.map((alert, index) => (
          <motion.button
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void handleAlertClick(alert)}
            className={`w-full text-left p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${
              alert.isUnread ? "bg-primary/5 border-primary/20 shadow-md" : "bg-transparent border-transparent hover:bg-primary/5"
            }`}
          >
            <div className="shrink-0 relative">
              {alert.type === "LIKE" && <Heart className="w-6 h-6 text-[#E0BFB8]" />}
              {alert.type === "MATCH" && <Sparkles className="w-6 h-6 text-[#E0BFB8]" />}
              {alert.type === "SYSTEM" && <Bell className="w-6 h-6 text-[#E0BFB8]" />}

              <img src={alert.image} alt={alert.title} className="w-14 h-14 rounded-full object-cover border border-white/10 mt-2" />

              {alert.isUnread && <div className="absolute top-0 right-0 w-3 h-3 bg-[#E0BFB8] rounded-full border-2 border-slate-900" />}
            </div>

            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
              <div className="flex justify-between items-center w-full">
                <h3 className="font-serif text-foreground text-[16px] truncate">{alert.title}</h3>
                <span className="text-[10px] text-foreground/30 tracking-widest font-bold shrink-0 ml-2 uppercase">{alert.timestamp}</span>
              </div>
              <p className={`text-[13px] leading-relaxed truncate ${alert.isUnread ? "text-primary" : "text-foreground/60 font-light"}`}>
                {alert.message}
              </p>
            </div>
          </motion.button>
        ))}

        <div className="w-full flex justify-center py-6 pb-20">
          <div className="w-1 h-1 rounded-full bg-foreground/20" />
        </div>
      </div>
    </div>
  );
}
