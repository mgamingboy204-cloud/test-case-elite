"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Tabs } from "@/app/components/ui/Tabs";
import { BottomSheet } from "@/app/components/ui/BottomSheet";
import { Badge } from "@/app/components/ui/Badge";
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

  // Motion Values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
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
        photo: item.primaryPhotoUrl ?? "/placeholder.svg",
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
    
    // Animate out
    x.set(direction);
    
    try {
      await apiFetch("/likes", {
        method: "POST",
        body: { toUserId: currentProfile.userId, type } as never,
      });
    } catch (e) {}

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      x.set(0);
    }, 200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* Premium Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-xl font-serif premium-text-gradient font-bold">Discover</h1>
        <div className="flex items-center gap-4">
           <Tabs
            tabs={[
              { label: "Elite", value: "all" },
              { label: "Dating", value: "dating" },
              { label: "Network", value: "friends" },
            ]}
            active={intent}
            onChange={setIntent}
            className="hidden md:flex"
          />
          <button 
            onClick={() => setFilterOpen(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="text-lg">⚙️</span>
          </button>
        </div>
      </header>

      {/* Main Interaction Area */}
      <main className="flex-grow flex flex-col items-center justify-center relative px-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="w-full max-w-[400px] aspect-[3/4] rounded-[2rem] overflow-hidden"
            >
              <Skeleton className="w-full h-full" />
            </motion.div>
          ) : error ? (
            <ErrorState key="error" onRetry={fetchProfiles} />
          ) : !currentProfile ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
               <EmptyState
                title="The circle is complete"
                description="You've seen all the elite members for today. Check back soon for new arrivals."
                action={{ label: "Broaden Search", onClick: () => setFilterOpen(true) }}
              />
            </motion.div>
          ) : (
            <div className="relative w-full max-w-[400px] aspect-[3/4.5] md:aspect-[3/4]">
              {/* Background card for stack effect */}
              {profiles[currentIndex + 1] && (
                <div className="absolute inset-0 scale-[0.95] translate-y-4 opacity-40 blur-sm">
                   <Card className="w-full h-full overflow-hidden rounded-[2.5rem] !p-0 border-white/5">
                      <img src={profiles[currentIndex + 1].photo} className="w-full h-full object-cover grayscale" alt="next" />
                   </Card>
                </div>
              )}

              <motion.div
                key={currentProfile.userId}
                style={{ x, rotate, opacity }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) handleAction("LIKE", 500);
                  else if (info.offset.x < -100) handleAction("PASS", -500);
                }}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              >
                <Card className="w-full h-full overflow-hidden rounded-[2.5rem] !p-0 border-white/10 relative group shadow-2xl bg-card">
                  {/* Indicators */}
                  <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-10 z-50 px-6 py-2 border-4 border-primary text-primary font-bold text-3xl rounded-xl rotate-[-20deg]">
                    ELITE
                  </motion.div>
                  <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-10 z-50 px-6 py-2 border-4 border-destructive text-destructive font-bold text-3xl rounded-xl rotate-[20deg]">
                    PASS
                  </motion.div>

                  <img 
                    src={currentProfile.photo} 
                    className="w-full h-full object-cover pointer-events-none" 
                    alt={currentProfile.name}
                  />

                  {/* Glass Info Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-background via-background/80 to-transparent">
                    <div className="flex items-center gap-3 mb-2">
                       <h2 className="text-3xl font-serif text-white">{currentProfile.name}, {currentProfile.age}</h2>
                       {currentProfile.verified && <span className="text-primary">✦</span>}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                       <Badge className="bg-white/5 border-white/10 text-xs uppercase tracking-widest">{currentProfile.city}</Badge>
                       {currentProfile.premium && <Badge className="premium-gradient border-none text-xs text-background font-bold">LEGACY</Badge>}
                    </div>

                    <p className="text-white/60 text-sm line-clamp-2 leading-relaxed font-light italic">
                      "{currentProfile.bio}"
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Action Footer */}
      {!loading && currentProfile && (
        <footer className="px-6 py-8 flex justify-center items-center gap-8">
           <button 
             onClick={() => handleAction("PASS", -500)}
             className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-300"
           >
             ✖
           </button>
           <button 
             onClick={() => handleAction("LIKE", 500)}
             className="w-20 h-20 rounded-full premium-gradient flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all duration-300"
           >
             ♥
           </button>
           <button 
             className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-primary/10 transition-all duration-300"
           >
             ⭐
           </button>
        </footer>
      )}

      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Preference Settings">
          <div className="p-4 space-y-6">
             <p className="text-muted-foreground text-sm italic">Define the parameters of your elite search.</p>
             {/* Filter UI would go here - simplified for plan adherence */}
             <Button className="btn-premium w-full py-6" onClick={() => setFilterOpen(false)}>Save Preferences</Button>
          </div>
      </BottomSheet>
    </div>
  );
}
