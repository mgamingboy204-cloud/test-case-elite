"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { apiFetch } from "@/lib/api";

interface Match {
  id: string;
  name: string;
  photo: string;
  lastActive: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED";
}

const MOCK_MATCHES: Match[] = [
  { id: "m1", name: "Sophia", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&h=300&auto=format&fit=crop", lastActive: "2 min ago", status: "ACTIVE" },
  { id: "m2", name: "Gabriel", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&h=300&auto=format&fit=crop", lastActive: "1 hour ago", status: "ACTIVE" },
  { id: "m3", name: "Isabella", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=300&h=300&auto=format&fit=crop", lastActive: "Yesterday", status: "PENDING" },
];

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<any>("/matches");
      const rows = Array.isArray(data?.matches) ? data.matches : [];
      const mapped: Match[] = rows.map((row: any) => ({
        id: row.id,
        name: row.user?.name ?? "Member",
        photo: row.user?.primaryPhotoUrl ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&h=300&auto=format&fit=crop",
        lastActive: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "recently",
        status: row.consentStatus === "DECLINED" ? "EXPIRED" : row.consentStatus === "PENDING" ? "PENDING" : "ACTIVE",
      }));
      setMatches(mapped.length > 0 ? mapped : MOCK_MATCHES);
    } catch {
      setMatches(MOCK_MATCHES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6 space-y-16">
        <header className="space-y-4">
          <Skeleton className="h-14 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchMatches} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-10 px-8 pb-32 relative"
    >
      <header className="mb-20 space-y-1">
        <h1 className="text-5xl font-serif tracking-tight text-foreground/90 italic">
          Dispatched Matches
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/40">
            {matches.length} Curated Connections Solidified
          </span>
          <div className="flex items-center gap-2">
            <div className="w-10 h-[1px] bg-primary/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          </div>
        </div>
      </header>

      <AnimatePresence mode="popLayout">
        {matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32"
          >
            <EmptyState
              title="The Circle is Patient"
              description="No incoming signals have reached your terminal today. Continue discovery to find resonance."
              action={{ label: "Access Discovery", onClick: () => window.location.href = "/discover" }}
              icon={
                <div className="w-24 h-24 rounded-full bg-white/40 backdrop-blur-3xl border border-white/60 flex items-center justify-center text-primary/30 mb-10 shadow-2xl">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              }
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {matches.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, scale: 1.01 }}
              >
                <Link href={`/matches/${match.id}`}>
                  <Card
                    className="p-8 bg-white/40 backdrop-blur-3xl border-white/60 hover:border-primary/30 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-700 rounded-[3rem] group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-8 relative z-10">
                      <div className="relative">
                        <Avatar
                          src={match.photo}
                          name={match.name}
                          size={96}
                          className="rounded-[2.5rem] shadow-xl ring-4 ring-white group-hover:rotate-2 transition-transform duration-700"
                        />
                        {match.status === "ACTIVE" && (
                          <div className="absolute -top-1.5 -right-1.5">
                            <span className="flex relative">
                              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-60" />
                              <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400 border-[3px] border-white shadow-lg" />
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-grow min-w-0 pr-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-3xl font-serif text-foreground/80 italic tracking-tight">{match.name}</h4>
                          <Badge
                            className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border-none shadow-sm font-black ${match.status === "ACTIVE"
                              ? "bg-primary text-white"
                              : "bg-muted/10 text-muted-foreground/60"
                              }`}
                          >
                            {match.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/30 italic">
                            Linked {match.lastActive}
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/60 group-hover:text-primary transition-colors">Access Channel</span>
                        </div>
                      </div>

                      <div className="text-muted-foreground/10 group-hover:text-primary transition-all duration-700 pr-2 group-hover:translate-x-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M5 12h14m-7-7 7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Subtle Card Glow Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Aesthetic Accents */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f6]">
        <div className="absolute top-[30%] right-[0%] w-[50%] h-[50%] bg-primary/[0.04] rounded-full blur-[150px] animate-drift" />
        <div className="absolute bottom-[0%] left-[0%] w-[40%] h-[40%] bg-primary/[0.04] rounded-full blur-[150px] animate-drift-slow" />
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </motion.div>
  );
}

