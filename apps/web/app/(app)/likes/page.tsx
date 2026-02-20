"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/Button";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

interface IncomingLike {
  id: string;
  userId: string;
  name: string;
  city: string;
  profession: string;
  photo: string;
}

const MOCK_LIKES: IncomingLike[] = [
  { id: "l1", userId: "u1", name: "Alessandra", city: "Milan", profession: "Creative Director", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&h=400&auto=format&fit=crop" },
  { id: "l2", userId: "u2", name: "Julian", city: "London", profession: "Architect", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&h=400&auto=format&fit=crop" },
  { id: "l3", userId: "u3", name: "Elara", city: "Paris", profession: "Art Curator", photo: "https://images.unsplash.com/photo-1531746020798-e795c5394c8b?q=80&w=400&h=400&auto=format&fit=crop" },
];

export default function LikesPage() {
  const { addToast } = useToast();
  const [likes, setLikes] = useState<IncomingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchLikes = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<any>("/likes/incoming");
      const incoming = Array.isArray(data?.incoming) ? data.incoming : [];
      const mapped: IncomingLike[] = incoming.map((item: any) => ({
        id: item.id,
        userId: item.fromUser?.id,
        name: item.fromUser?.profile?.name ?? "Member",
        city: item.fromUser?.profile?.city ?? "Global",
        profession: item.fromUser?.profile?.profession ?? "Elite Member",
        photo: item.fromUser?.profile?.photos?.[0]?.url ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&h=400&auto=format&fit=crop",
      })).filter((item: IncomingLike) => Boolean(item.userId));
      setLikes(mapped.length > 0 ? mapped : MOCK_LIKES);
    } catch {
      setLikes(MOCK_LIKES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikes();
  }, []);

  const handleAction = async (like: IncomingLike, type: "LIKE" | "PASS") => {
    setActioning(like.id);
    try {
      await apiFetch("/likes", {
        method: "POST",
        body: { toUserId: like.userId, type } as never,
      });
      setLikes((prev) => prev.filter((l) => l.id !== like.id));
      addToast(
        type === "LIKE" ? `Synergy established with ${like.name}.` : `Interest from ${like.name} has been archived.`,
        "success"
      );
    } catch {
      addToast("A technical disruption occurred. Please try again.", "error");
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-8 space-y-16">
        <header className="space-y-4">
          <Skeleton className="h-14 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[420px] rounded-[3.5rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchLikes} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto py-12 px-8 pb-32 relative"
    >
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f6]">
        <div className="absolute top-[30%] left-[0%] w-[50%] h-[50%] bg-primary/[0.04] rounded-full blur-[150px] animate-drift" />
        <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[40%] bg-primary/[0.04] rounded-full blur-[150px] animate-drift-slow" />
        <div className="absolute top-[10%] right-[20%] w-[25%] h-[25%] bg-primary/[0.02] rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <header className="mb-20 space-y-1">
        <h1 className="text-5xl font-serif tracking-tight text-foreground/90 italic">
          Seekers of Connection
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/40">
            {likes.length} Dispatched Admiration Signals
          </span>
          <div className="w-10 h-[1px] bg-primary/20" />
        </div>
      </header>

      <AnimatePresence mode="popLayout">
        {likes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            key="empty-state"
            className="py-32"
          >
            <EmptyState
              title="A Moment of Quietude"
              description="Your admirers are currently gathering their thoughts. Continue your discovery of the exceptional in the meantime."
              icon={
                <div className="w-24 h-24 rounded-full bg-white/40 backdrop-blur-3xl border border-white/60 flex items-center justify-center text-primary/30 mb-10 shadow-2xl">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
              }
              action={{ label: "Discover More", onClick: () => window.location.href = "/discover" }}
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {likes.map((like, idx) => (
              <motion.div
                key={like.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
                transition={{ duration: 0.8, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="relative group overflow-hidden flex flex-col items-center text-center p-12 bg-white/50 backdrop-blur-3xl border-white/70 hover:border-primary/20 hover:shadow-[0_40px_80px_-20px_rgba(232,165,178,0.12)] transition-all duration-700 rounded-[3.5rem]">
                  <div className="relative mb-10">
                    <div className="relative">
                      <Avatar
                        src={like.photo}
                        name={like.name}
                        size={128}
                        className="rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] ring-4 ring-white transition-all duration-1000 group-hover:scale-110 group-hover:rotate-3"
                      />
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-2xl border border-primary/10 backdrop-blur-xl group-hover:bg-primary transition-colors duration-700"
                      >
                        <div className="text-primary group-hover:text-white transition-colors duration-700">
                          <span className="text-lg">♥</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <div className="mb-12 space-y-3">
                    <h4 className="text-3xl font-serif text-foreground/80 italic tracking-tight">{like.name}</h4>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 italic">{like.profession}</span>
                      <div className="w-6 h-px bg-primary/10" />
                      <span className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 italic">{like.city}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 w-full relative z-10">
                    <Button
                      variant="premium"
                      fullWidth
                      loading={actioning === like.id}
                      onClick={() => handleAction(like, "LIKE")}
                      className="py-7 rounded-[1.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
                    >
                      Establish Synergy
                    </Button>
                    <Button
                      variant="ghost"
                      fullWidth
                      loading={actioning === like.id}
                      onClick={() => handleAction(like, "PASS")}
                      className="py-5 text-muted-foreground/30 hover:text-red-400 text-[9px] uppercase tracking-[0.4em] font-black transition-all duration-500 hover:bg-red-50/50 rounded-[1.25rem]"
                    >
                      Gracefully Archive
                    </Button>
                  </div>

                  {/* Subtle Card Glow / Ambient Background */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/[0.04] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

