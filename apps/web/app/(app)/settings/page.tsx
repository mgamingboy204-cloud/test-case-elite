"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const handleLogout = async () => {
    addToast("Gracefully signing out. Your presence is memorialized.", "info");
    router.push("/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto py-16 px-6 pb-40"
    >
      <header className="mb-20 space-y-4">
        <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-foreground/90 italic">
          Vault Settings
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">
            Refine & Safeguard Your Identity
          </span>
          <div className="w-12 h-[1px] bg-primary/20" />
        </div>
      </header>

      <div className="space-y-16">
        {/* Appearance */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-6">
            <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/30 italic flex-shrink-0">The Experience</h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex-grow h-px bg-gradient-to-r from-primary/10 to-transparent origin-left"
            />
          </div>
          <Card className="p-10 bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] group">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <p className="font-serif text-2xl text-foreground/80 italic group-hover:text-foreground transition-colors">Cinematic Environment</p>
                <p className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.2em] italic">Enhanced fluidity & visual orchestration</p>
              </div>
              <CustomToggle defaultOn />
            </div>
          </Card>
        </section>

        {/* Notifications */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-6">
            <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/30 italic flex-shrink-0">Liaison Alerts</h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex-grow h-px bg-gradient-to-r from-primary/10 to-transparent origin-left"
            />
          </div>
          <Card className="p-12 bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] space-y-12 rounded-[3.5rem] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]">
            <ToggleSetting label="Direct Connections" desc="Notifications for mutual synergy discoveries" defaultOn />
            <ToggleSetting label="Admiration Signals" desc="When a new soul reaches out to your profile" defaultOn />
            <ToggleSetting label="Editorial Periodicals" desc="Premium insights and feature previews" defaultOn={false} />
          </Card>
        </section>

        {/* Account */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-6">
            <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/30 italic flex-shrink-0">Identity Verification</h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex-grow h-px bg-gradient-to-r from-primary/10 to-transparent origin-left"
            />
          </div>
          <Card className="overflow-hidden bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3.5rem] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col">
              <SettingLink href="/onboarding/payment" label="Membership Tiers & Billing" />
              <SettingLink href="/onboarding/video-verification" label="Biometric Verification Status" />
              <SettingLink href="/refunds" label="Fiscal Policies" />
              <SettingLink href="/report" label="Report a Discrepancy" isLast />
            </div>
          </Card>
        </section>

        <div className="pt-16 text-center space-y-10">
          <Button
            variant="ghost"
            fullWidth
            onClick={handleLogout}
            className="py-8 rounded-[2rem] text-[10px] uppercase tracking-[0.5em] font-black text-muted-foreground/30 hover:text-red-400/60 hover:bg-white/40 hover:backdrop-blur-3xl hover:border-white/60 transition-all duration-700 italic border border-transparent"
          >
            Terminal Output (Sign Out)
          </Button>
          <div className="space-y-2 opacity-20">
            <p className="text-[9px] uppercase tracking-[0.6em] font-black text-muted-foreground italic">Elite Match Protocol v1.5.0</p>
            <p className="text-[8px] uppercase tracking-[0.4em] font-black text-muted-foreground italic">Synchronized at Current Time</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CustomToggle({ defaultOn = false, onChange }: { defaultOn?: boolean, onChange?: (val: boolean) => void }) {
  const [on, setOn] = useState(defaultOn);

  const handleToggle = () => {
    const newState = !on;
    setOn(newState);
    onChange?.(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative w-16 h-8 rounded-full transition-all duration-1000 ease-[0.16,1,0.3,1] ${on ? "bg-primary shadow-[0_15px_30px_-5px_rgba(232,165,178,0.5)] border border-primary/20" : "bg-black/[0.03] border border-black/[0.03]"
        }`}
    >
      <motion.div
        animate={{ x: on ? 36 : 4 }}
        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-hidden"
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <AnimatePresence>
          {on && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="w-1.5 h-1.5 rounded-full bg-primary/40"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}

function ToggleSetting({
  label,
  desc,
  defaultOn = true,
}: {
  label: string;
  desc: string;
  defaultOn?: boolean;
}) {
  return (
    <div className="flex justify-between items-center group transition-all duration-700 hover:translate-x-2">
      <div className="space-y-2">
        <p className="font-serif text-xl text-foreground/70 italic group-hover:text-foreground transition-colors">{label}</p>
        <p className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.2em] italic pr-8">{desc}</p>
      </div>
      <CustomToggle defaultOn={defaultOn} />
    </div>
  );
}

function SettingLink({ href, label, isLast = false }: { href: string; label: string; isLast?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex justify-between items-center px-12 py-9 text-sm font-medium text-foreground/50 hover:text-primary hover:bg-primary/[0.01] transition-all duration-700 group ${!isLast ? "border-b border-primary/[0.03]" : ""
        }`}
    >
      <span className="font-serif italic text-2xl group-hover:translate-x-2 transition-transform duration-700">{label}</span>
      <div className="w-10 h-10 rounded-2xl border border-primary/5 flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/10 group-hover:rotate-45 transition-all duration-700">
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" className="text-muted-foreground/20 group-hover:text-primary transition-colors -rotate-45"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}
