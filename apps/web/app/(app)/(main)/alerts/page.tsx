"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";

interface Alert {
  id: string;
  type: "INTEREST" | "CONNECTION" | "CONCIERGE";
  title: string;
  message: string;
  timestamp: string;
  image: string;
  isUnread: boolean;
  targetId?: number;
}

interface NotificationApiItem {
  id: string;
  type: "NEW_LIKE" | "NEW_MATCH" | "NEW_MESSAGE" | "SYSTEM_PROMO" | "PROFILE_VIEW" | "VIDEO_VERIFICATION_UPDATE";
  isRead: boolean;
  createdAt: string;
  title?: string | null;
  message?: string | null;
  deepLinkUrl?: string | null;
  imageUrl?: string | null;
  actor: { photos: Array<{ url: string }> } | null;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80";

function toAlert(item: NotificationApiItem): Alert {
  const normalizedType = item.type === "NEW_MATCH" ? "CONNECTION" : item.type === "SYSTEM_PROMO" ? "CONCIERGE" : "INTEREST";
  const title =
    item.title ??
    (item.type === "NEW_MATCH" ? "New Match" : item.type === "NEW_LIKE" ? "New Interest" : item.type === "SYSTEM_PROMO" ? "Elite Update" : "Update");
  const message =
    item.message ??
    (item.type === "NEW_MATCH"
      ? "A new match is waiting for your move."
      : item.type === "NEW_LIKE"
        ? "A member showed interest in your profile."
        : item.type === "SYSTEM_PROMO"
          ? "Concierge shared a new update for you."
          : "You have a new notification.");

  return {
    id: item.id,
    type: normalizedType,
    title,
    message,
    timestamp: new Date(item.createdAt).toLocaleDateString(),
    image: item.imageUrl ?? item.actor?.photos[0]?.url ?? FALLBACK_IMAGE,
    isUnread: !item.isRead
  };
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
      const response = await apiRequest<{ notifications: NotificationApiItem[] }>("/notifications", { auth: true });
      setAlerts(response.notifications.map(toAlert));
    };

    void loadNotifications();
  }, [isAuthenticated, onboardingStep]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  const handleAlertClick = async (alert: Alert) => {
    if (alert.isUnread) {
      setAlerts((current) => current.map((entry) => (entry.id === alert.id ? { ...entry, isUnread: false } : entry)));
      void apiRequest("/notifications/read", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ ids: [alert.id] })
      });
    }

    if (alert.type === "INTEREST") {
      router.push("/likes");
    } else if (alert.type === "CONNECTION") {
      router.push("/matches");
    } else if (alert.type === "CONCIERGE") {
      router.push("/matches");
    }
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
            onClick={() => handleAlertClick(alert)}
            className={`w-full text-left p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${
              alert.isUnread ? "bg-primary/5 border-primary/20 shadow-md" : "bg-transparent border-transparent hover:bg-primary/5"
            }`}
          >
            <div className="shrink-0 relative">
              {alert.type === "INTEREST" && (
                <img src={alert.image} alt="Blurred profile" className="w-14 h-14 rounded-full object-cover blur-sm border border-white/10 opacity-80" />
              )}
              {alert.type === "CONNECTION" && (
                <img src={alert.image} alt={alert.title} className="w-14 h-14 rounded-[1rem] object-cover border border-white/10 shadow-sm" />
              )}
              {alert.type === "CONCIERGE" && (
                <div className="relative">
                  <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-highlight to-primary opacity-50 blur-sm animate-pulse" />
                  <img
                    src={alert.image}
                    alt={alert.title}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#E0BFB8] relative z-10 shadow-[0_0_15px_rgba(224,191,184,0.4)]"
                  />
                </div>
              )}

              {alert.isUnread && alert.type !== "CONCIERGE" && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-[#E0BFB8] rounded-full border-2 border-slate-900" />
              )}
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
