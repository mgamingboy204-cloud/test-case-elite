"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";

const features = [
  {
    icon: "◎",
    title: "Video Verified",
    desc: "Every member is identity-verified through a live biometric session for absolute authenticity.",
  },
  {
    icon: "✦",
    title: "Quality Matches",
    desc: "Our orchestrator focuses on significant compatibility, not volume. Fewer, profound connections.",
  },
  {
    icon: "◈",
    title: "Elite Experience",
    desc: "No ads, no bots, no distractions. A clean, premium environment dedicated to your legacy.",
  },
  {
    icon: "✨",
    title: "Safe & Private",
    desc: "End-to-end encryption, priority reporting, and a dedicated curatorial concierge.",
  },
];

const stats = [
  { value: "$50K+", label: "Avg Member Income" },
  { value: "12K+", label: "Elite Dates Booked" },
  { value: "98%", label: "Satisfaction Rate" },
];

function FeatureCard({ title, icon, desc, index }: { title: string; icon: string; desc: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
    >
      <Card className="p-10 bg-white/50 backdrop-blur-3xl border-white/70 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] group hover:shadow-[0_40px_80px_-20px_rgba(232,165,178,0.15)] transition-all duration-700 h-full relative overflow-hidden">
        {/* Gradient corner glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/[0.07] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-2xl text-primary/50 mb-8 group-hover:rotate-12 group-hover:bg-primary group-hover:text-white group-hover:border-primary/0 group-hover:shadow-[0_12px_24px_-6px_rgba(232,165,178,0.4)] transition-all duration-700 relative z-10">
          {icon}
        </div>
        <h4 className="text-2xl font-serif italic text-foreground/80 mb-4 relative z-10 group-hover:text-foreground transition-colors duration-500">{title}</h4>
        <p className="text-sm text-muted-foreground/50 leading-relaxed italic relative z-10">{desc}</p>

        {/* Bottom accent border */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </Card>
    </motion.div>
  );
}

export default function HomePage() {
  const { scrollY } = useScroll();
  const heroImageY = useTransform(scrollY, [0, 600], [0, -60]);

  return (
    <div className="relative overflow-hidden pt-16">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/[0.04] rounded-full blur-[150px] animate-drift" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/[0.06] rounded-full blur-[120px] animate-drift-slow" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-primary/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* ── Hero Section ────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20 md:py-36">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            <div className="space-y-5">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/5 border border-primary/10"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/70 italic">
                  The Future of Significant Connection
                </span>
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-serif italic tracking-tight text-foreground/90 leading-[0.9]">
                Start something <br />
                <span className="premium-text-gradient">profound.</span>
              </h1>
            </div>

            <p className="text-xl text-muted-foreground/50 font-serif italic max-w-lg leading-relaxed border-l-2 border-primary/15 pl-8">
              A meticulously curated environment for ambitious individuals ready for connections that transcend the superficial.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link href="/signup">
                <Button size="xl" className="px-12 py-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(232,165,178,0.5)] text-[10px] uppercase tracking-[0.4em] font-black hover:scale-[1.02] hover:shadow-[0_30px_80px_-15px_rgba(232,165,178,0.6)] transition-all duration-700">
                  Authorize Membership
                </Button>
              </Link>
              <Link href="/login">
                <Button size="xl" variant="secondary" className="px-12 py-8 rounded-[2rem] text-[10px] uppercase tracking-[0.4em] font-black italic hover:bg-white hover:border-primary/20 transition-all duration-700">
                  Return to Origin
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex -space-x-3">
                {["photo-1534528741775-53994a69daeb", "photo-1507003211169-0a1dd7228f2d", "photo-1494790108377-be9c29b29330"].map((id, i) => (
                  <div key={id} className={`w-9 h-9 rounded-2xl border-2 border-white overflow-hidden shadow-lg`} style={{ zIndex: 3 - i }}>
                    <img src={`https://images.unsplash.com/${id}?q=80&w=100&h=100&auto=format&fit=crop`} className="w-full h-full object-cover" alt="member" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40 italic">12,000+ Elite Members</p>
                <div className="flex gap-0.5 mt-1">
                  {[0, 1, 2, 3, 4].map((i) => <span key={i} className="text-primary text-xs">★</span>)}
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,0.18)] group relative">
              <motion.img
                src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80"
                alt="Elite Connection"
                style={{ y: heroImageY }}
                className="w-full h-[110%] -mt-[5%] object-cover group-hover:scale-110 transition-transform duration-[3s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />

              {/* Info card overlay */}
              <div className="absolute bottom-10 left-10 right-10 bg-white/15 backdrop-blur-3xl border border-white/30 p-8 rounded-[2.5rem] shadow-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </span>
                  <p className="text-[9px] uppercase tracking-[0.5em] font-black text-white/80 italic">Active Curations</p>
                </div>
                <p className="text-xl font-serif italic text-white leading-tight">Authentic identity, verified biometric signal.</p>
              </div>
            </div>

            {/* Decorative rings */}
            <div className="absolute -top-12 -right-12 w-48 h-48 border border-primary/10 rounded-full animate-pulse pointer-events-none" />
            <div className="absolute -top-8 -right-8 w-32 h-32 border border-primary/5 rounded-full animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />

            {/* Floating pill badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="absolute -left-10 top-1/3 bg-white/80 backdrop-blur-3xl border border-white/60 px-6 py-4 rounded-3xl shadow-2xl"
            >
              <p className="text-[9px] uppercase tracking-[0.3em] font-black text-primary/60">Verified Identity</p>
              <p className="font-serif italic text-xl text-foreground/80 mt-0.5">✦ Biometric</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────── */}
      <section className="relative z-10 border-y border-primary/5 bg-white/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-primary/5">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.12 }}
                className="py-14 md:py-20 flex flex-col items-center gap-2 group cursor-default"
              >
                <span className="text-5xl md:text-6xl font-serif italic text-primary/80 group-hover:scale-110 transition-transform duration-700">{s.value}</span>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-px bg-primary/20" />
                  <span className="text-[10px] uppercase tracking-[0.5em] font-black text-muted-foreground/30 italic">{s.label}</span>
                  <div className="w-6 h-px bg-primary/20" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-32 md:py-48">
        <header className="mb-24 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-[12px] uppercase tracking-[0.6em] font-black text-primary/40 italic font-sans">The Elite Protocol</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-serif italic text-foreground/90 tracking-tight"
          >
            Why Choose the Collective
          </motion.h2>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 py-24 md:pb-60">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-16 md:p-28 text-center rounded-[5rem] overflow-hidden relative group border-0">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-[#c4657a]" />

            {/* Animated orbs inside */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2], x: [0, -30, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-20 -right-20 w-80 h-80 bg-black/10 rounded-full blur-[100px] pointer-events-none"
            />

            {/* Noise texture */}
            <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

            <div className="relative z-10 space-y-12">
              <div className="space-y-5">
                <p className="text-[10px] uppercase tracking-[0.6em] font-black text-white/40 italic font-sans">
                  Access the most exclusive circle in the digital realm.
                </p>
                <h2 className="text-4xl md:text-7xl font-serif italic text-white tracking-tight leading-[0.9]">
                  Your legacy in <br /> connection begins.
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/signup">
                  <Button size="xl" variant="secondary" className="px-16 py-8 rounded-[2rem] text-[10px] uppercase tracking-[0.4em] font-black bg-white text-primary hover:bg-white/95 hover:scale-[1.02] transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]">
                    Begin Identity Synthesis
                  </Button>
                </Link>
                <Link href="/learn">
                  <button className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 hover:text-white/80 transition-colors duration-500 italic border-b border-white/10 hover:border-white/30 pb-1">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
