"use client";

import type { ComponentType } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Briefcase, Ruler, X, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { apiRequest } from "@/lib/api";

type DiscoverPhoto = {
  id: string;
  url: string;
};

type DiscoverItem = {
  userId: string;
  name: string;
  age: number;
  city: string;
  bioShort: string;
  intent?: string;
  videoVerificationStatus?: string | null;
  primaryPhotoUrl: string | null;
  photos?: DiscoverPhoto[];
  isMutualMatch?: boolean;
};

export default function DiscoverPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [item, setItem] = useState<DiscoverItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/signin');
    else if (onboardingStep !== 'COMPLETED') router.replace('/onboarding/verification');
  }, [isAuthenticated, onboardingStep, router]);

  useEffect(() => {
    const loadDiscover = async () => {
      if (!isAuthenticated || onboardingStep !== "COMPLETED") return;
      setIsLoading(true);
      try {
        const response = await apiRequest<{ items: DiscoverItem[] }>("/discover/feed?limit=1", { auth: true });
        const nextItem = response.items[0] ?? null;
        setItem(nextItem);
        setActivePhotoIndex(0);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDiscover();
  }, [isAuthenticated, onboardingStep]);

  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ["start start", "end start"]
  });

  const photoOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.5]);
  const photoScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  async function submitAction(action: "LIKE" | "PASS") {
    if (!item) return;
    await apiRequest("/likes", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        action,
        targetUserId: item.userId,
        actionId: `${action}-${item.userId}-${Date.now()}`
      })
    });

    setIsLoading(true);
    const response = await apiRequest<{ items: DiscoverItem[] }>("/discover/feed?limit=1", { auth: true });
    setItem(response.items[0] ?? null);
    setActivePhotoIndex(0);
    setIsLoading(false);
  }

  if (!isAuthenticated || onboardingStep !== 'COMPLETED') return null;

  const photoList = item?.photos?.length ? item.photos : item?.primaryPhotoUrl ? [{ id: "primary", url: item.primaryPhotoUrl }] : [];
  const activePhoto = photoList[activePhotoIndex]?.url ?? null;

  return (
    <div className="w-full h-full relative bg-background transition-colors duration-500 overflow-hidden flex flex-col">
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory relative no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="w-full relative snap-start">
          <div className="relative z-10 w-full">
            <motion.div
              style={{ opacity: photoOpacity, scale: photoScale, transformOrigin: 'top center' }}
              className="w-full h-[80vh] overflow-hidden relative shadow-2xl bg-slate-900"
            >
              <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-gradient-to-t from-black/[0.08] to-transparent z-10 pointer-events-none" />
              {isLoading ? (
                <div className="w-full h-full animate-pulse bg-foreground/10" />
              ) : activePhoto ? (
                <img
                  src={activePhoto}
                  alt={item?.name ?? "Member"}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground/60">No profiles available</div>
              )}

              {!!photoList.length && (
                <div className="absolute top-4 left-4 right-4 z-20 flex gap-2">
                  {photoList.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setActivePhotoIndex(index)}
                      className={`h-1 flex-1 rounded-full ${index === activePhotoIndex ? "bg-white" : "bg-white/40"}`}
                      aria-label={`View photo ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="absolute bottom-10 left-8 z-20">
                <h1 className="text-6xl font-serif text-white mb-3 drop-shadow-xl tracking-wide">
                  {item?.name ?? "Member"}, <span className="font-light">{item?.age ?? "-"}</span>
                </h1>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.3em] text-white/95 bg-black/30 backdrop-blur-xl w-fit px-4 py-2 rounded-full border border-white/10">
                  <MapPin size={12} />
                  {item?.city ?? "Unknown"}
                </div>
              </div>

              {item?.videoVerificationStatus === "APPROVED" && (
                <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold bg-primary/20 text-white border border-primary/50">
                  Verified
                </div>
              )}
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
                  {item?.bioShort ? `"${item.bioShort}"` : '"No bio available yet."'}
                </p>
              </motion.div>

              <div className="grid grid-cols-2 gap-5">
                <InfoPill icon={Briefcase} text={item?.intent ?? "dating"} />
                <InfoPill icon={Ruler} text={item?.isMutualMatch ? "Mutual Match" : "Open Discovery"} />
              </div>

              <div className="flex flex-col gap-5 mt-4">
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-foreground/40 font-bold mb-1">Status</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag text={item?.videoVerificationStatus ?? "NOT_REQUESTED"} />
                  <Tag text={item?.city ?? "Unknown"} />
                </div>
              </div>

              <div className="w-full flex justify-center mt-16 mb-24">
                <button className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-bold text-foreground/20 hover:text-foreground/50 transition-colors">
                  <ShieldAlert size={14} />
                  Report Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-10 px-10 flex justify-between items-end z-40 w-full max-w-lg mx-auto pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => void submitAction("PASS")}
          disabled={!item || isLoading}
          className="w-[76px] h-[76px] rounded-full bg-background/40 backdrop-blur-2xl border border-primary/40 flex items-center justify-center pointer-events-auto relative overflow-hidden group shadow-xl disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <X size={34} strokeWidth={1} className="text-primary drop-shadow-sm z-10" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => void submitAction("LIKE")}
          disabled={!item || isLoading}
          className="w-28 h-28 rounded-full bg-background/40 backdrop-blur-3xl shadow-[0_20px_50px_rgba(200,155,144,0.2)] border border-primary/60 flex items-center justify-center pointer-events-auto relative overflow-hidden group disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <HeartEliteIcon />
        </motion.button>
      </div>
    </div>
  );
}

function InfoPill({ icon: Icon, text }: { icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; text: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-foreground/5 metallic-border backdrop-blur-md">
      <Icon size={18} className="text-highlight" strokeWidth={1} />
      <span className="text-xs uppercase tracking-[0.15em] font-medium text-foreground/90">{text}</span>
    </div>
  )
}

function Tag({ text }: { text: string }) {
  return (
    <div className="px-5 py-2 rounded-full bg-foreground/5 metallic-border text-[10px] text-foreground/90 uppercase tracking-[0.2em] font-medium backdrop-blur-md shadow-sm">
      {text}
    </div>
  )
}

function HeartEliteIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="z-10 drop-shadow-[0_0_15px_rgba(200,155,144,0.4)]">
      <path
        d="M12 21C12 21 4.5 14.5 4.5 8.5C4.5 5.5 6.5 3.5 9 3.5C10.5 3.5 11.5 4 12 5C12.5 4 13.5 3.5 15 3.5C17.5 3.5 19.5 5.5 19.5 8.5C19.5 14.5 12 21 12 21Z"
        stroke="url(#goldGradient)"
        strokeWidth="1.2"
      />
      <defs>
        <linearGradient id="goldGradient" x1="4.5" y1="3.5" x2="19.5" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary)" stopOpacity="1" />
          <stop offset="1" stopColor="var(--highlight)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
