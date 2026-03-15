"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, BadgeCheck, Briefcase, Ruler, LogOut, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { apiRequest } from "@/lib/api";
import { fetchProfile } from "@/lib/queries";
import { useStaleWhileRevalidate } from "@/lib/cache";

type ProfileViewModel = {
  name: string;
  age: number;
  location: string;
  image: string;
  profession: string;
  height: string;
  story: string;
  subscription: { tier: string; status: string };
  settings: {
    pushNotificationsEnabled: boolean;
    profileVisible: boolean;
    showOnlineStatus: boolean;
    discoverableByPremiumOnly: boolean;
  };
  photos: Array<{ id: string; url: string; photoIndex?: number | null }>;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80";

function toHeightCm(height: string) {
  const m = height.trim().match(/^(\d)'\s*(\d{1,2})"?$/);
  if (!m) return undefined;
  return Math.round((Number(m[1]) * 12 + Number(m[2])) * 2.54);
}

export default function ProfilePage() {
  const { isAuthenticated, onboardingStep, logout } = useAuth();

  const [view, setView] = useState<"portfolio" | "settings" | "edit">("portfolio");
  const [model, setModel] = useState<ProfileViewModel | null>(null);

  const profileQuery = useStaleWhileRevalidate({
    key: "profile",
    fetcher: fetchProfile,
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    staleTimeMs: 60_000
  });

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  return (
    <div className="w-full h-full relative">
      <AnimatePresence mode="wait">
        {view === "portfolio" && <PortfolioView key="portfolio" onSettings={() => setView("settings")} onEdit={() => setView("edit")} model={model ?? profileQuery.data ?? null} />}
        {view === "settings" && (
          <SettingsView
            key="settings"
            onClose={() => setView("portfolio")}
            onLogout={logout}
            model={model ?? profileQuery.data ?? null}
            onSave={async (settings) => {
              await apiRequest("/profile/settings", { method: "PATCH", auth: true, body: JSON.stringify(settings) });
              setModel((prev) => (prev ? { ...prev, settings: { ...prev.settings, ...settings } } : prev));
            }}
          />
        )}
        {view === "edit" && (
          <EditView
            key="edit"
            onClose={() => setView("portfolio")}
            model={model ?? profileQuery.data ?? null}
            onSave={async (partial) => {
              await apiRequest("/profile", { method: "PATCH", auth: true, body: JSON.stringify(partial) });
              setModel((prev) => (prev ? { ...prev, ...partial } : prev));
              setView("portfolio");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PortfolioView({ onSettings, onEdit, model }: { onSettings: () => void; onEdit: () => void; model: ProfileViewModel | null }) {
  const user = model ?? {
    name: "Aisha",
    age: 27,
    location: "MUMBAI",
    image: FALLBACK_IMAGE,
    profession: "Creative Director",
    height: "5'8\"",
    story:
      "Wandering through the world with an eye for design and a taste for the extraordinary. Seeking someone who appreciates the quiet moments just as much as the grand adventures.",
    subscription: { tier: "FREE", status: "INACTIVE" },
    settings: { pushNotificationsEnabled: true, profileVisible: true, showOnlineStatus: true, discoverableByPremiumOnly: false },
    photos: []
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(10px)" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full pb-20">
      <div className="relative w-full aspect-[4/5] rounded-b-3xl overflow-hidden shadow-2xl snap-start">
        <motion.img layoutId="profile-image" src={user.image} alt="Profile" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <button onClick={onSettings} className="absolute top-[env(safe-area-inset-top,24px)] right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all z-20 border border-white/10 shadow-sm">
          <Settings size={20} className="text-primary" />
        </button>

        <div className="absolute bottom-10 left-8 z-20 flex flex-col">
          <motion.div layoutId="profile-name-container" className="flex items-center gap-3">
            <h2 className="text-5xl font-serif text-white tracking-wide drop-shadow-xl">
              {user.name}, <span className="font-light">{user.age}</span>
            </h2>
            <BadgeCheck size={28} className="text-primary drop-shadow-xl" strokeWidth={2} />
          </motion.div>
          <motion.p layoutId="profile-location" className="text-[11px] uppercase tracking-[0.3em] font-medium text-white/50 mt-2">
            {user.location}
          </motion.p>
        </div>
      </div>

      <div className="px-6 pt-6 flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full p-4 rounded-2xl bg-foreground/5 backdrop-blur-md metallic-border flex items-center gap-4">
          <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80" alt="Agent Julian" className="w-8 h-8 rounded-full object-cover border border-primary/50" />
          <span className="text-xs text-foreground/80 font-light tracking-wide">Under the care of Agent Julian. {user.subscription.tier} access.</span>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div layoutId="profile-profession" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-4 rounded-2xl bg-foreground/5 metallic-border flex flex-col items-start gap-2">
            <Briefcase size={18} className="text-primary" strokeWidth={1.5} />
            <span className="text-sm font-medium text-foreground/90">{user.profession}</span>
          </motion.div>
          <motion.div layoutId="profile-height" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-4 rounded-2xl bg-foreground/5 metallic-border flex flex-col items-start gap-2">
            <Ruler size={18} className="text-primary" strokeWidth={1.5} />
            <span className="text-sm font-medium text-foreground/90">{user.height}</span>
          </motion.div>
        </div>

        <motion.div layoutId="profile-story" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full pt-4 pb-6">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary mb-3">The Story</h3>
          <p className="font-serif text-2xl leading-relaxed text-foreground/90">&ldquo;{user.story}&rdquo;</p>
        </motion.div>

        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={onEdit} className="w-full py-4 rounded-xl border border-primary/40 text-primary uppercase text-[10px] tracking-widest font-semibold bg-transparent hover:bg-primary/5 transition-all shadow-sm">
          Edit Portfolio
        </motion.button>
      </div>
    </motion.div>
  );
}

function EditView({ onClose, model, onSave }: { onClose: () => void; model: ProfileViewModel | null; onSave: (payload: any) => Promise<void> }) {
  const user = model ?? { profession: "Creative Director", height: "5'8\"", story: "" };
  const [profession, setProfession] = useState(user.profession);
  const [height, setHeight] = useState(user.height);
  const [story, setStory] = useState(user.story);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="w-full h-full flex flex-col z-50 bg-background">
      <div className="w-full pt-[env(safe-area-inset-top,24px)] pb-4 px-6 flex justify-between items-center border-b border-foreground/5 shrink-0">
        <h1 className="text-lg tracking-[0.2em] font-medium text-foreground uppercase">Edit Identity</h1>
        <button onClick={onClose} className="p-2 -mr-2 text-foreground/60 hover:text-foreground">
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 w-full overflow-y-auto px-6 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <motion.div layoutId="profile-profession" className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Profession</label>
            <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full bg-foreground/5 border border-border/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-foreground" />
          </motion.div>
          <motion.div layoutId="profile-height" className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Height</label>
            <input type="text" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-foreground/5 border border-border/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-foreground" />
          </motion.div>
        </div>

        <motion.div layoutId="profile-story" className="flex flex-col gap-2 mt-4">
          <label className="text-[10px] uppercase tracking-widest text-primary font-bold">The Story</label>
          <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={6} className="w-full bg-foreground/5 border border-border/10 rounded-xl px-5 py-5 font-serif text-lg leading-relaxed focus:outline-none focus:border-primary text-foreground resize-none" />
        </motion.div>

        <button
          onClick={() =>
            void onSave({
              profession,
              story,
              bioShort: story,
              heightCm: toHeightCm(height)
            })
          }
          className="w-full py-4 mt-8 rounded-xl bg-primary text-background uppercase text-[10px] tracking-widest font-semibold shadow-md"
        >
          Save Portfolio
        </button>
      </div>
    </motion.div>
  );
}

function SettingsView({ onClose, onLogout, model, onSave }: { onClose: () => void; onLogout: () => void; model: ProfileViewModel | null; onSave: (settings: any) => Promise<void> }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onLogout();
  };

  const settings = model?.settings ?? {
    pushNotificationsEnabled: true,
    profileVisible: true,
    showOnlineStatus: true,
    discoverableByPremiumOnly: false
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4 }} className="w-full h-full flex flex-col z-[60] bg-background">
      <div className="w-full pt-[env(safe-area-inset-top,24px)] pb-4 px-6 flex justify-between items-center bg-background/80 backdrop-blur-md shrink-0 border-b border-foreground/5">
        <h1 className="text-lg tracking-[0.4em] font-medium text-primary uppercase">The Vault</h1>
        <button onClick={onClose} className="p-2 -mr-2 text-foreground/60 hover:text-foreground">
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 w-full overflow-y-auto px-6 py-8 flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] uppercase tracking-widest text-foreground/40 font-semibold pl-1">Appearance</h3>
          <div className="w-full p-4 rounded-2xl bg-foreground/5 flex items-center justify-between border border-foreground/5">
            <span className="text-sm font-medium text-foreground">Theme</span>
            {mounted && (
              <button onClick={toggleTheme} className="w-14 h-8 rounded-full bg-foreground/10 p-1 flex items-center transition-colors relative">
                <motion.div className="w-6 h-6 rounded-full bg-primary shadow-sm" layout animate={{ x: theme === "dark" ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              </button>
            )}
          </div>
          <div className="w-full p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/70">Push Notifications: {settings.pushNotificationsEnabled ? "On" : "Off"}</div>
          <button onClick={() => void onSave({ pushNotificationsEnabled: !settings.pushNotificationsEnabled })} className="w-full p-3 rounded-xl bg-primary/10 text-primary text-xs uppercase tracking-widest">Toggle Push Notifications</button>
        </div>

        <div className="flex flex-col gap-4 mt-auto pb-12">
          <h3 className="text-[10px] uppercase tracking-widest text-foreground/40 font-semibold pl-1">Security & Access</h3>

          <HoldToConfirmAction label="End Session" colorClass="text-slate-500 dark:text-slate-400" bgClass="bg-foreground/5" icon={LogOut} onConfirm={onLogout} />

          <HoldToConfirmAction label="Permanently Erase Portfolio" colorClass="text-[#9b2c2c]" bgClass="bg-[#9b2c2c]/10" icon={Trash2} onConfirm={() => setShowDeleteModal(true)} />
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-sm rounded-[2rem] bg-foreground/5 p-8 border border-foreground/10 flex flex-col items-center text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#9b2c2c]/20 flex items-center justify-center mb-6">
                <Trash2 size={28} className="text-[#9b2c2c]" />
              </div>
              <h2 className="text-xl font-serif text-foreground mb-3">Irreversible Erase</h2>
              <p className="text-sm font-light text-foreground/70 leading-relaxed mb-8">This action is irreversible. All connections and concierge history will be permanently wiped.</p>
              <div className="flex flex-col w-full gap-3">
                <button onClick={handleDeleteConfirm} className="w-full py-4 rounded-xl bg-[#9b2c2c] text-white uppercase text-[10px] tracking-widest font-semibold shadow-md">Confirm Erasure</button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 rounded-xl bg-transparent text-foreground uppercase text-[10px] tracking-widest font-semibold">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HoldToConfirmAction({ label, colorClass, bgClass, icon: Icon, onConfirm }: any) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const animationRef = useRef<number | null>(null);

  const HOLD_TIME = 500;

  const startHold = () => {
    setHolding(true);
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const p = Math.min((now - startTime) / HOLD_TIME, 1);
      setProgress(p);

      if (p < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onConfirm();
        setHolding(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const endHold = () => {
    setHolding(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setProgress(0);
  };

  return (
    <button onPointerDown={startHold} onPointerUp={endHold} onPointerLeave={endHold} className={`relative w-full overflow-hidden p-4 rounded-2xl flex items-center justify-center gap-3 metallic-border transition-transform ${holding ? "scale-[0.98]" : "scale-100"} ${bgClass}`} style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      <div className="absolute inset-0 bg-foreground/10 origin-left" style={{ transform: `scaleX(${progress})`, transition: holding ? "none" : "transform 0.3s ease-out" }} />
      <div className="relative z-10 flex items-center gap-3">
        <Icon size={18} className={colorClass} />
        <span className={`text-sm font-medium ${colorClass}`}>{label}</span>
      </div>

      <AnimatePresence>
        {progress > 0 && progress < 1 && (
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-1 right-3 text-[8px] uppercase tracking-widest text-foreground/50">
            Hold
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
