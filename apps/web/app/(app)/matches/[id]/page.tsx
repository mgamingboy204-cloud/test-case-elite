"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const matchId = String(params.id);

  const handleConsent = async (response: "YES" | "NO") => {
    setLoading(true);
    try {
      await apiFetch("/consent/respond", {
        method: "POST",
        body: { matchId, response } as never,
      });
      if (response === "YES") {
        setConsentGiven(true);
        addToast("Connection solidified. Identity shared.", "success");
      } else {
        addToast("Connection archived gracefully.", "info");
        router.push("/matches");
      }
    } catch {
      // For demo, if API fails
      if (response === "YES") {
        setConsentGiven(true);
        addToast("Identity unlocked for demonstration.", "success");
      } else {
        router.push("/matches");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-12 px-8 pb-32 relative"
    >
      <button
        onClick={() => router.push("/matches")}
        className="flex items-center gap-6 text-muted-foreground/30 hover:text-primary transition-all duration-700 mb-16 group"
      >
        <div className="w-12 h-12 rounded-2xl border border-primary/10 flex items-center justify-center group-hover:bg-white group-hover:shadow-xl transition-all duration-700">
          <span className="text-xl group-hover:-translate-x-1 transition-transform duration-700">←</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.5em] font-black italic">Return to Collection</span>
      </button>

      <div className="space-y-16">
        {/* Profile Dossier */}
        <Card className="overflow-hidden p-0 border-white shadow-[0_60px_120px_-30px_rgba(0,0,0,0.12)] rounded-[3.5rem] bg-white">
          <div className="relative h-[480px] overflow-hidden group">
            <img
              src={`https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&h=800&auto=format&fit=crop`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s] ease-[0.16,1,0.3,1]"
              alt="Match Essence"
            />
            {/* Cinematic Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="relative">
                  <Avatar
                    src={`https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&h=300&auto=format&fit=crop`}
                    name="Alessandra"
                    size={112}
                    className="ring-[6px] ring-white/10 shadow-2xl rounded-[2.5rem] backdrop-blur-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-full shadow-lg border-2 border-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <h2 className="text-5xl md:text-6xl font-serif text-white italic tracking-tight">Alessandra, 26</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-white/60 text-[10px] uppercase tracking-[0.4em] font-black italic border-l-2 border-primary/40 pl-4">Creative Director</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <p className="text-white/60 text-[10px] uppercase tracking-[0.4em] font-black italic">Milan, IT</p>
                  </div>
                </div>
              </div>
              <Badge className="bg-white/10 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/20 text-[9px] uppercase tracking-[0.3em] font-black text-white shadow-xl self-start md:self-auto uppercase">
                Verified Identity
              </Badge>
            </div>
          </div>

          <div className="p-16 grid grid-cols-1 lg:grid-cols-5 gap-20">
            <div className="lg:col-span-3 space-y-12">
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <h4 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40">The Narrative Essence</h4>
                  <div className="flex-grow h-px bg-primary/5" />
                </div>
                <p className="text-2xl md:text-3xl leading-[1.6] font-serif text-foreground/70 italic first-letter:text-7xl first-letter:mr-4 first-letter:float-left first-letter:text-primary/30 first-letter:font-serif first-letter:leading-[0.8] first-letter:mt-2">
                  Curating beauty in the everyday, from architectural lines to the perfect espresso. Seeking a companion for intellectual wanderlust and shared silences that speak volumes.
                </p>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <h4 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40">Personal Affinities</h4>
                  <div className="flex-grow h-px bg-primary/5" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {["Contemporary Art", "Brutalist Architecture", "Vinyl Collections", "Alpine Hiking", "Sustainable Curation", "Aesthetics"].map((tag) => (
                    <div key={tag} className="px-6 py-3 rounded-2xl bg-white border border-black/[0.03] shadow-sm hover:border-primary/20 hover:shadow-md transition-all duration-700">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40 italic">{tag}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-2 space-y-10">
              <div className="p-10 rounded-[3rem] bg-[#faf8f6] border border-black/[0.03] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 mb-8 relative z-10">Interaction Ledger</h5>
                <div className="space-y-6 relative z-10">
                  <ProfileDetail label="Linked On" value="October 24th" />
                  <ProfileDetail label="Compatibility" value="Harmonious" />
                  <ProfileDetail label="Channel" value="Elite Discovery" last />
                </div>
              </div>

              <div className="p-10 rounded-[3rem] bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                <p className="text-[9px] uppercase tracking-[0.3em] font-black text-primary/40 mb-4">Proximity Status</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-serif italic text-foreground/80">4.2</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/30 pb-1.5">Kilometers Away</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Section */}
        <div className="relative">
          <Card className="p-16 border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] bg-white/40 backdrop-blur-3xl rounded-[3.5rem] text-center space-y-12 border-white/60 overflow-hidden relative">
            <header className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-4xl md:text-5xl font-serif text-foreground/90 italic tracking-tight">
                {consentGiven ? "Mutual Synergy Established" : "Establish a Direct Lineage"}
              </h3>
              <p className="text-lg text-muted-foreground/60 leading-relaxed font-serif italic max-w-lg mx-auto">
                Elevate your connection beyond the collective. Exchange identity fragments to initiate a private frequency.
              </p>
            </header>

            <AnimatePresence mode="wait">
              {consentGiven ? (
                <motion.div
                  key="unlocked"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative z-10 px-6"
                >
                  <div className="inline-block p-12 rounded-[3rem] bg-white border border-black/[0.03] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                    <p className="text-[10px] uppercase tracking-[0.6em] font-black text-primary/40 mb-8 italic">Secured Identifier Access</p>
                    <p className="text-5xl md:text-6xl font-serif text-foreground/90 tracking-tighter italic select-all cursor-copy hover:text-primary transition-colors duration-500">
                      +39 345 678 9012
                    </p>
                    <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
                      <Button variant="premium" className="px-12 py-7 rounded-[1.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black">
                        Initiate Dialogue
                      </Button>
                      <Button variant="ghost" className="px-12 py-7 text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 hover:text-foreground">
                        Archive Copy
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="lock-actions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row gap-8 max-w-xl mx-auto"
                >
                  <Button
                    variant="ghost"
                    fullWidth
                    loading={loading}
                    onClick={() => handleConsent("NO")}
                    className="py-7 rounded-[1.5rem] text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/30 hover:text-red-400 border-black/5 hover:bg-red-50"
                  >
                    Archive Interest
                  </Button>
                  <Button
                    variant="premium"
                    fullWidth
                    loading={loading}
                    onClick={() => handleConsent("YES")}
                    className="py-7 rounded-[1.5rem] shadow-2xl shadow-primary/30 text-[10px] uppercase tracking-[0.3em] font-black"
                  >
                    Permit Identify Exchange
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cinematic Accents */}
            <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -right-32 -top-32 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          </Card>
        </div>
      </div>

      {/* Aesthetic Accents */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f6]">
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-[10%] left-[0%] w-[60%] h-[60%] bg-primary/[0.04] rounded-full blur-[180px] animate-pulse" />
      </div>
    </motion.div>
  );
}

function ProfileDetail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-4 ${!last ? "border-b border-primary/5" : ""}`}>
      <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/30 italic">{label}</span>
      <span className="text-sm font-serif italic text-foreground/60">{value}</span>
    </div>
  );
}

