"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Tabs } from "@/app/components/ui/Tabs";
import { BottomSheet } from "@/app/components/ui/BottomSheet";
import { Badge } from "@/app/components/ui/Badge";
import { Card } from "@/app/components/ui/Card";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

interface Profile {
  id: string;
  userId: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  photo: string;
  verified: boolean;
  premium: boolean;
}

export default function DiscoverPage() {
  const { addToast } = useToast();
  const [intent, setIntent] = useState("all");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Cinematic Motion Values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-10, 10]);
  const opacity = useTransform(x, [-350, -250, 0, 250, 350], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-300, 0, 300], [0.92, 1, 0.92]);

  // Soft glowing indicators
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<any>(`/discover/feed?intent=${intent}&limit=24`);
      const items = Array.isArray(data?.items) ? data.items : [];
      const mapped: Profile[] = items.map((item: any) => ({
        id: item.userId,
        userId: item.userId,
        name: item.name ?? "Member",
        age: Number(item.age ?? 25),
        city: item.city ?? "Secret Location",
        bio: item.bioShort ?? "An elite member has not added a bio yet.",
        photo: item.primaryPhotoUrl ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
        verified: item.videoVerificationStatus === "APPROVED",
        premium: item.role === "ADMIN",
      }));
      setProfiles(mapped);
      setCurrentIndex(0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [intent]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const currentProfile = profiles[currentIndex];

  const handleAction = async (type: "LIKE" | "PASS", direction: number) => {
    if (!currentProfile) return;

    // Smooth cinematic throw
    x.set(direction);

    try {
      await apiFetch("/likes", {
        method: "POST",
        body: { toUserId: currentProfile.userId, type } as never,
      });
      if (type === "LIKE") {
        addToast(`Signal dispatched to ${currentProfile.name}`, "success");
      }
    } catch (e) { }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      x.set(0);
    }, 500); // Heavier cinematic weight
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden relative">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[5%] w-[40%] h-[40%] bg-primary/[0.04] rounded-full blur-[120px] animate-drift" />
        <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-primary/[0.04] rounded-full blur-[100px] animate-drift-slow" />
      </div>
      {/* Cinematic Inner Noise Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0" />

      {/* Cinematic Header */}
      <header className="px-10 py-10 flex items-center justify-between relative z-20">
        <div className="space-y-2">
          <h1 className="text-5xl font-serif text-foreground/90 italic tracking-tight">Discovery</h1>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">Curated Aspirations</span>
            <div className="w-12 h-[1px] bg-primary/20" />
          </div>
        </div>

        <div className="flex items-center gap-8">
          <Tabs
            tabs={[
              { label: "Elite", value: "all" },
              { label: "Dating", value: "dating" },
              { label: "Protocol", value: "friends" },
            ]}
            active={intent}
            onChange={setIntent}
            className="hidden md:flex bg-white/40 shadow-sm border-white/60 backdrop-blur-3xl rounded-2xl p-1"
          />
          <button
            onClick={() => setFilterOpen(true)}
            className="w-16 h-16 rounded-[2rem] bg-white/40 backdrop-blur-3xl border border-white/60 flex items-center justify-center hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] hover:border-primary/20 hover:scale-105 transition-all duration-700 group"
          >
            <span className="text-xl group-hover:rotate-90 transition-transform duration-1000 text-muted-foreground/30 group-hover:text-primary/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </span>
          </button>
        </div>
      </header>

      {/* Main Swipe Surface */}
      <main className="flex-grow flex flex-col items-center justify-center relative px-6 pb-24 z-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full max-w-[460px] h-[70vh] max-h-[760px] rounded-[4rem] overflow-hidden shadow-2xl relative border border-white/60"
            >
              <Skeleton className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
            </motion.div>
          ) : error ? (
            <div className="max-w-md w-full">
              <ErrorState key="error" onRetry={fetchProfiles} />
            </div>
          ) : !currentProfile ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 text-center"
            >
              <EmptyState
                title="The Circle is Complete"
                description="You&apos;ve experienced all curated discovery signals for this cycle. Reflections will resume shortly."
                action={{ label: "Expand Parameters", onClick: () => setFilterOpen(true) }}
              />
            </motion.div>
          ) : (
            <div className="relative w-full max-w-[460px] h-[72vh] max-h-[780px]">
              {/* Card stack depth — 3rd card */}
              {profiles[currentIndex + 2] && (
                <div className="absolute inset-x-14 inset-y-0 translate-y-20 scale-[0.83] opacity-10 transition-all duration-1000">
                  <div className="w-full h-full rounded-[4rem] overflow-hidden bg-white/60 border border-white/40" />
                </div>
              )}
              {/* Card stack depth — 2nd card */}
              {profiles[currentIndex + 1] && (
                <div className="absolute inset-x-6 inset-y-0 translate-y-10 scale-[0.92] opacity-30 transition-all duration-1000 ease-[0.16,1,0.3,1]">
                  <div className="w-full h-full rounded-[4rem] overflow-hidden shadow-2xl border border-white/40">
                    <img src={profiles[currentIndex + 1].photo} className="w-full h-full object-cover grayscale-[0.3] blur-[1px]" alt="next" />
                  </div>
                </div>
              )}

              <motion.div
                key={currentProfile.userId}
                style={{ x, rotate, opacity, scale }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 150) handleAction("LIKE", 1000);
                  else if (info.offset.x < -150) handleAction("PASS", -1000);
                }}
                className="w-full h-full cursor-grab active:cursor-grabbing will-change-[transform,opacity] z-10"
              >
                <div className="w-full h-full overflow-hidden rounded-[4rem] border border-white shadow-[0_80px_160px_-40px_rgba(0,0,0,0.15)] bg-white relative group">

                  {/* Swipe Feedback Overlays */}
                  <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 z-40 bg-gradient-to-tr from-transparent via-primary/5 to-primary/40 pointer-events-none" />
                  <motion.div style={{ opacity: likeOpacity }} className="absolute top-20 left-16 z-50">
                    <div className="px-12 py-5 bg-white/95 backdrop-blur-3xl border border-white/50 text-primary font-serif italic tracking-[0.4em] text-4xl rounded-[2rem] shadow-2xl -rotate-[12deg] scale-110">
                      DISPATCH
                    </div>
                  </motion.div>

                  <motion.div style={{ opacity: nopeOpacity }} className="absolute inset-0 z-40 bg-gradient-to-tl from-transparent via-black/5 to-black/30 pointer-events-none" />
                  <motion.div style={{ opacity: nopeOpacity }} className="absolute top-20 right-16 z-50">
                    <div className="px-12 py-5 bg-black/80 backdrop-blur-3xl border border-white/10 text-white font-serif italic tracking-[0.4em] text-4xl rounded-[2rem] shadow-2xl rotate-[12deg] scale-110">
                      ARCHIVE
                    </div>
                  </motion.div>

                  <img
                    src={currentProfile.photo}
                    className="w-full h-full object-cover pointer-events-none transition-transform duration-[4s] ease-[0.16,1,0.3,1] group-hover:scale-110"
                    alt={currentProfile.name}
                  />

                  {/* Premium Information Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-14 pt-48">
                    <div className="flex flex-wrap gap-3 mb-8">
                      <Badge className="bg-white/10 backdrop-blur-3xl border-white/10 text-white text-[9px] uppercase tracking-[0.4em] font-black py-2.5 px-5 rounded-full">
                        {currentProfile.city}
                      </Badge>
                      {currentProfile.premium && (
                        <Badge className="bg-gradient-to-r from-primary to-primary/80 border-none text-[9px] text-white uppercase tracking-[0.4em] font-black py-2.5 px-5 rounded-full shadow-xl shadow-primary/20">
                          Elite Tier
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-5">
                        <h2 className="text-5xl md:text-6xl font-serif text-white tracking-tighter leading-none italic">
                          {currentProfile.name}, <span className="font-light opacity-50 not-italic">{currentProfile.age}</span>
                        </h2>
                        {currentProfile.verified && (
                          <div className="w-7 h-7 bg-primary/20 backdrop-blur-3xl rounded-full flex items-center justify-center border border-primary/30 shadow-2xl animate-pulse">
                            <span className="text-primary text-xs">✦</span>
                          </div>
                        )}
                      </div>
                      <p className="text-white/60 text-xl font-serif italic leading-relaxed line-clamp-2 pr-8 border-l-2 border-primary/30 pl-6">
                        &ldquo;{currentProfile.bio}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Glassmorphic card frame */}
                  <div className="absolute inset-0 border-[1.5rem] border-white/5 pointer-events-none rounded-[4rem]" />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Cinematic Action Controls */}
      <AnimatePresence>
        {!loading && currentProfile && (
          <motion.footer
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="px-10 py-16 flex justify-center items-center gap-12 absolute bottom-0 left-0 right-0 z-50 pointer-events-auto"
          >
            <motion.button
              whileHover={{ scale: 1.15, y: -6, rotate: -5 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleAction("PASS", -1000)}
              className="w-20 h-20 rounded-[2.5rem] bg-white/80 backdrop-blur-xl border border-white/80 flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] transition-all duration-700 text-muted-foreground/30 hover:text-red-400/80 hover:border-red-100 hover:shadow-[0_20px_50px_-10px_rgba(220,100,100,0.15)] group"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-45 transition-transform duration-500">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08, y: -12 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleAction("LIKE", 1000)}
              className="relative w-32 h-32 rounded-[3rem] flex items-center justify-center text-5xl text-white border-4 border-white transition-all duration-700 overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #e8a5b2 0%, #c47685 100%)",
                boxShadow: "0 30px 80px -15px rgba(232,165,178,0.65), 0 0 0 0 rgba(232,165,178,0)",
              }}
            >
              <span className="relative z-10 group-hover:scale-125 transition-transform duration-700">♥</span>
              <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-2 rounded-[3.5rem] border-2 border-primary/30 opacity-0 group-hover:opacity-100 scale-100 group-hover:scale-110 transition-all duration-700" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.15, y: -6, rotate: 5 }}
              whileTap={{ scale: 0.85 }}
              className="w-20 h-20 rounded-[2.5rem] bg-white/80 backdrop-blur-xl border border-white/80 flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] transition-all duration-700 text-primary/30 hover:text-primary hover:border-primary/20 hover:shadow-[0_20px_50px_-10px_rgba(232,165,178,0.2)] group"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform duration-500">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </motion.button>
          </motion.footer>
        )}
      </AnimatePresence>

      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Discovery Curation">
        <div className="p-14 space-y-12 bg-[#faf8f6]">
          <header className="space-y-4">
            <h3 className="text-5xl font-serif italic tracking-tight text-foreground/80">Curation Parameters</h3>
            <p className="text-muted-foreground/50 font-serif italic leading-relaxed text-xl pr-12">
              Refine the resonance of your curated discovery signals.
            </p>
          </header>

          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase tracking-[0.5em] font-black text-muted-foreground/30 italic">Liaison Range</span>
                <span className="text-2xl font-serif italic tracking-tight text-primary/80">Regional (50km)</span>
              </div>
              <div className="h-1 w-full bg-black/[0.02] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary/40 rounded-full" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase tracking-[0.5em] font-black text-muted-foreground/30 italic">Age Spectrum</span>
                <span className="text-2xl font-serif italic tracking-tight text-primary/80">24 — 32 Era</span>
              </div>
              <div className="h-1 w-full bg-black/[0.02] rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-primary/40 rounded-full mx-auto" />
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Button
              variant="premium"
              size="xl"
              fullWidth
              onClick={() => setFilterOpen(false)}
              className="py-8 rounded-[2rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
            >
              Apply Curation Signal
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
