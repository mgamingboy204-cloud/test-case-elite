"use client";

import Link from "next/link";
import { type MouseEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
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

function FeatureCard({ title, icon, desc, index }: { title: string; icon: string; desc: string, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="p-10 bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] group hover:shadow-[0_40px_80px_-20px_rgba(232,165,178,0.1)] transition-all duration-700 h-full">
        <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-2xl text-primary/60 mb-8 group-hover:rotate-12 group-hover:bg-primary group-hover:text-white transition-all duration-700">
          {icon}
        </div>
        <h4 className="text-2xl font-serif italic text-foreground/80 mb-4">{title}</h4>
        <p className="text-sm text-muted-foreground/50 leading-relaxed italic">{desc}</p>
      </Card>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <div className="relative overflow-hidden pt-32">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/[0.05] rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-24 md:py-40">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="text-[12px] uppercase tracking-[0.6em] font-black text-primary italic"
              >
                The Future of Significant Connection
              </motion.p>
              <h1 className="text-6xl md:text-8xl font-serif italic tracking-tight text-foreground/90 leading-[0.9]">
                Start something <br />
                <span className="text-primary/80">profound.</span>
              </h1>
            </div>

            <p className="text-xl text-muted-foreground/40 font-serif italic max-w-lg leading-relaxed border-l-2 border-primary/10 pl-8">
              A meticulously curated environment for ambitious individuals ready for connections that transcend the superficial.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link href="/signup">
                <Button size="xl" className="px-12 py-8 rounded-[2rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black">
                  Authorize Membership
                </Button>
              </Link>
              <Link href="/login">
                <Button size="xl" variant="secondary" className="px-12 py-8 rounded-[2rem] text-[10px] uppercase tracking-[0.4em] font-black italic">
                  Return to Origin
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,0.15)] group relative">
              <img
                src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80"
                alt="Elite Connection"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

              <div className="absolute bottom-12 left-12 right-12 bg-white/20 backdrop-blur-3xl border border-white/40 p-10 rounded-[2.5rem] shadow-2xl">
                <p className="text-[10px] uppercase tracking-[0.5em] font-black text-white/90 mb-2 italic">Active Curations</p>
                <p className="text-2xl font-serif italic text-white leading-tight">Authentic identity, verified biometric signal.</p>
              </div>
            </div>

            {/* Decorative Element */}
            <div className="absolute -top-12 -right-12 w-48 h-48 border border-primary/10 rounded-full animate-pulse pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 border-y border-primary/5 bg-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-primary/5">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="py-12 md:py-20 flex flex-col items-center gap-2 group"
              >
                <span className="text-5xl md:text-6xl font-serif italic text-primary/80 group-hover:scale-110 transition-transform duration-700">{s.value}</span>
                <span className="text-[10px] uppercase tracking-[0.5em] font-black text-muted-foreground/30 italic">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-32 md:py-48">
        <header className="mb-24 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-[12px] uppercase tracking-[0.6em] font-black text-primary/40 italic font-sans">The Elite Protocol</p>
            <div className="w-12 h-[1px] bg-primary/20" />
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

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 py-32 md:pb-64">
        <Card className="p-16 md:p-32 bg-primary text-center rounded-[5rem] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-[#d12836] opacity-90" />

          {/* Noise Texture */}
          <div className="absolute inset-0 opacity-[0.05] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

          <div className="relative z-10 space-y-12">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-7xl font-serif italic text-white tracking-tight leading-[0.9]">
                Your legacy in <br /> connection begins.
              </h2>
              <p className="text-[11px] uppercase tracking-[0.6em] font-black text-white/40 italic font-sans">
                Access the most exclusive circle in the digital realm.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link href="/signup">
                <Button size="xl" variant="secondary" className="px-16 py-8 rounded-[2rem] text-[10px] uppercase tracking-[0.4em] font-black bg-white text-primary hover:bg-white/90">
                  Begin Identity Synthesis
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative Blurs */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-black/10 rounded-full blur-[120px]" />
        </Card>
      </section>
    </div>
  );
}
