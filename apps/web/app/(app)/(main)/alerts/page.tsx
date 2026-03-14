"use client";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAlerts } from "@/lib/hooks";
import { Bell, Heart, Sparkles } from "lucide-react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80";

export default function AlertsPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useAlerts();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/signin");
    else if (onboardingStep !== "COMPLETED") router.replace("/onboarding/verification");
  }, [isAuthenticated, onboardingStep, router]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  const notifications = data?.notifications ?? [];

  return (
    <div className="w-full h-full px-4 pt-8 pb-20">
      <h1 className="text-xl tracking-[0.4em] text-primary uppercase text-center mb-6">Alerts</h1>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gradient-to-r from-[#E0BFB8]/10 via-[#E0BFB8]/20 to-[#E0BFB8]/10 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item: any) => {
            const eventType = item.event_type ?? item.eventCategory ?? "SYSTEM";
            const actorImage = item.actorPreview?.actorImageUrl ?? FALLBACK_IMAGE;
            return (
              <button
                key={item.id}
                onClick={async () => {
                  if (!item.isRead) await apiRequest(`/notifications/${item.id}/read`, { method: "PATCH", auth: true });
                  router.push(item.targetRoute ?? "/alerts");
                }}
                className="w-full p-4 rounded-2xl border border-primary/20 text-left flex items-center gap-3"
              >
                <div className="relative w-12 h-12">
                  <Image src={actorImage} alt="alert" fill className="rounded-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-primary">
                    {eventType === "LIKE" ? <Heart size={14} /> : eventType === "MATCH" ? <Sparkles size={14} /> : <Bell size={14} />}
                    <span className="text-xs uppercase tracking-wider">{eventType}</span>
                    {!item.isRead && <span className="w-2 h-2 rounded-full bg-[#E0BFB8]" />}
                  </div>
                  <p className="text-sm text-foreground/80">{item.eventMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
