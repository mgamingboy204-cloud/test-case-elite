"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Info, MapPin, Briefcase, Ruler, X, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";


type DiscoverItem = {
  userId: string;
  name: string;
  age: number;
  city: string;
  bioShort: string;
  primaryPhotoUrl: string | null;
};

export default function DiscoverPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasScrolled, setHasScrolled] = useState(false);
  const [item, setItem] = useState<DiscoverItem | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/signin');
    else if (onboardingStep !== 'COMPLETED') router.replace('/onboarding/verification');
  }, [isAuthenticated, onboardingStep, router]);

  useEffect(() => {
    const loadDiscover = async () => {
      if (!isAuthenticated || onboardingStep !== "COMPLETED") return;
      const response = await apiRequest<{ items: DiscoverItem[] }>("/discover/feed?limit=1", { auth: true });
      setItem(response.items[0] ?? null);
    };

    void loadDiscover();
  }, [isAuthenticated, onboardingStep]);

  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ["start start", "end start"]
  });

  const photoOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.5]);
  const photoScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  if (!isAuthenticated || onboardingStep !== 'COMPLETED') return null;

  return (
    <div className="w-full h-full relative bg-background transition-colors duration-500 overflow-hidden flex flex-col">

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory relative no-scrollbar"
        onScroll={(e) => setHasScrolled((e.target as HTMLDivElement).scrollTop > 50)}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Main Profile Card Envelope - Edge to Edge */}
        <div className="w-full relative snap-start">

          <div className="relative z-10 w-full">

            {/* 1. Hero Image Frame - 80vh Edge to Edge */}
            <motion.div
              style={{ opacity: photoOpacity, scale: photoScale, transformOrigin: 'top center' }}
              className="w-full h-[80vh] overflow-hidden relative shadow-2xl bg-slate-900"
            >
              {/* Single-pass gradient — transparent top → 70% to solid background — no mid-step */}
              {/* Minimal bottom scrim — 8% height, 8% opacity: just enough to anchor text, photo stays crystal clear */}
              <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-gradient-to-t from-black/[0.08] to-transparent z-10 pointer-events-none" />
              <img
                src={item?.primaryPhotoUrl ?? "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=2127&auto=format&fit=crop"}
                alt={item?.name ?? "Member"}
                className="w-full h-full object-cover object-center"
              />

              {/* Name & Age Overlay */}
              <div className="absolute bottom-10 left-8 z-20">
                <h1 className="text-6xl font-serif text-white mb-3 drop-shadow-xl tracking-wide">
                  {item?.name ?? "Aisha"}, <span className="font-light">{item?.age ?? 27}</span>
                </h1>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.3em] text-white/95 bg-black/30 backdrop-blur-xl w-fit px-4 py-2 rounded-full border border-white/10">
                  <div className="w-2 h-2 rotate-45 bg-primary shadow-[0_0_12px_rgba(200,155,144,0.8)]" />
                  {item?.city ?? "New Delhi, India"}
                </div>
              </div>
            </motion.div>

            {/* 2. Scroll Revealed Content */}
            <div className="w-full mt-10 flex flex-col gap-12 px-6 md:px-12 pb-40">

              {/* Bio Block */}
              <motion.div
                initial={{ opacity: 0.2, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ root: containerRef, margin: "-20px" }}
                transition={{ duration: 0.8 }}
                className="w-full"
              >
                <p className="text-3xl md:text-4xl font-serif text-foreground leading-[1.3] italic font-light">
                  {item?.bioShort ? `"${item.bioShort}"` : '"Curating art collections by day, hunting for the perfect matcha by night. I value deep conversations over small talk."'}
                </p>
              </motion.div>

              {/* Info Matrix */}
              <div className="grid grid-cols-2 gap-5">
                <InfoPill icon={Briefcase} text="Art Director" />
                <InfoPill icon={Ruler} text="5'8&quot; (173cm)" />
              </div>

              {/* Tags/Interests */}
              <div className="flex flex-col gap-5 mt-4">
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-foreground/40 font-bold mb-1">Passions</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag text="Contemporary Art" />
                  <Tag text="Matcha" />
                  <Tag text="Architecture" />
                  <Tag text="Oeno-tourism" />
                </div>
              </div>

              {/* Internal Photo 2 */}
              <motion.div
                initial={{ opacity: 0.5, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ root: containerRef, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className="w-full aspect-[3/4] rounded-[3rem] overflow-hidden relative shadow-2xl mt-6 border border-border/10"
              >
                <img
                  src="https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=1974&auto=format&fit=crop"
                  alt="Aisha secondary"
                  className="w-full h-full object-cover object-center"
                />
              </motion.div>

              {/* Report Block */}
              <div className="w-full flex justify-center mt-16 mb-24">
                <button className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-bold text-foreground/20 hover:text-foreground/50 transition-colors">
                  Report Profile
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons (Fixed over scroll) */}
      {/* Floating Action Buttons (Fixed over scroll) */}
<div className="absolute left-0 right-0 bottom-10 px-10 flex justify-between items-center z-40 w-full max-w-lg mx-auto pointer-events-none">

  {/* Pass Button (X) */}
  <motion.button
    whileTap={{ scale: 0.9 }}
    whileHover={{ scale: 1.05 }}
    {/* Standardized size to w-20 h-20 */}
    className="w-20 h-20 rounded-full bg-background/40 backdrop-blur-2xl border border-primary/40 flex items-center justify-center pointer-events-auto relative overflow-hidden group shadow-xl"
  >
    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <X size={32} strokeWidth={1} className="text-primary drop-shadow-sm z-10" />
  </motion.button>

  {/* Like Button (Heart) */}
  <motion.button
    whileTap={{ scale: 0.9 }}
    whileHover={{ scale: 1.05 }}
    {/* Matched size to w-20 h-20 for perfect symmetry */}
    className="w-20 h-20 rounded-full bg-background/40 backdrop-blur-3xl shadow-[0_20px_50px_rgba(200,155,144,0.2)] border border-primary/60 flex items-center justify-center pointer-events-auto relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-primary/10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
    {/* Optical Nudge: the translate-y-[2px] balances the heart's pointy bottom */}
    <div className="translate-y-[2px]">
      <HeartEliteIcon />
    </div>
  </motion.button>

</div>
    </div>
  );
}

function InfoPill({ icon: Icon, text }: { icon: any, text: string }) {
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
