"use client";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useDiscoverFeed } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&auto=format&fit=crop&q=80";

function ShimmerCard() {
  return <div className="w-full h-[80vh] rounded-b-3xl bg-gradient-to-r from-[#E0BFB8]/10 via-[#E0BFB8]/20 to-[#E0BFB8]/10 animate-pulse" />;
}

export default function DiscoverPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useDiscoverFeed();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/signin");
    else if (onboardingStep !== "COMPLETED") router.replace("/onboarding/verification");
  }, [isAuthenticated, onboardingStep, router]);

  useEffect(() => {
    if (!isAuthenticated || onboardingStep !== "COMPLETED") return;
    void queryClient.prefetchQuery({ queryKey: ["likes", "received"], queryFn: () => apiRequest("/likes/received", { auth: true }) });
    void queryClient.prefetchQuery({ queryKey: ["matches"], queryFn: () => apiRequest("/matches", { auth: true }) });
  }, [isAuthenticated, onboardingStep, queryClient]);

  const items = data?.items ?? [];
  const current = items[index] ?? null;
  const mediaUrls = useMemo(() => {
    if (!current) return [] as string[];
    if (Array.isArray(current.media_urls) && current.media_urls.length) return current.media_urls;
    if (Array.isArray(current.photos) && current.photos.length) return current.photos.map((p: any) => p.url);
    return current.primaryPhotoUrl ? [current.primaryPhotoUrl] : [FALLBACK_IMAGE];
  }, [current]);

  async function submitAction(action: "LIKE" | "PASS") {
    if (!current) return;
    const targetUserId = current.u_id ?? current.userId;
    setIndex((v) => v + 1); // optimistic
    try {
      await apiRequest("/likes", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ action, targetUserId, actionId: `${action}-${targetUserId}-${Date.now()}` })
      });
      void queryClient.invalidateQueries({ queryKey: ["likes", "received"] });
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    } catch {
      setIndex((v) => Math.max(0, v - 1));
    }
  }

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  return (
    <div className="w-full h-full relative bg-background overflow-hidden">
      {isLoading ? (
        <ShimmerCard />
      ) : !current ? (
        <div className="w-full h-full flex items-center justify-center text-foreground/60">No profiles available</div>
      ) : (
        <>
          <div className="relative w-full h-[80vh] overflow-hidden">
            <Image
              src={mediaUrls[0] ?? FALLBACK_IMAGE}
              alt={current.display_name ?? current.name ?? "Member"}
              fill
              priority
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MCcgaGVpZ2h0PSc2MCc+PHJlY3Qgd2lkdGg9JzQwJyBoZWlnaHQ9JzYwJyBmaWxsPScjRTBCRkI4Jy8+PC9zdmc+"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-8 z-20 text-white">
              <h1 className="text-5xl font-serif">{current.display_name ?? current.name}, <span className="font-light">{current.age ?? "-"}</span></h1>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40">
                <MapPin size={12} /> {(current.city ?? "Unknown").toUpperCase()}
              </div>
            </div>
          </div>
          <div className="px-6 py-8 pb-36">
            <p className="text-2xl font-serif">“{current.bio ?? current.bioShort ?? "No bio available."}”</p>
          </div>
          <div className="absolute left-0 right-0 bottom-10 px-10 flex justify-between z-40">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => void submitAction("PASS")} className="w-[76px] h-[76px] rounded-full bg-background/50 border border-primary/30 flex items-center justify-center"><X className="text-primary" /></motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => void submitAction("LIKE")} className="w-[92px] h-[92px] rounded-full bg-background/50 border border-primary/50 text-primary">♥</motion.button>
          </div>
        </>
      )}
    </div>
  );
}
