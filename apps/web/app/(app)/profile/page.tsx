"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { Avatar } from "@/app/components/ui/Avatar";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

interface UserProfile {
  name: string;
  age: number;
  city: string;
  profession: string;
  bio: string;
  photos: { id: string; url: string; primary: boolean }[];
  verified: boolean;
}

const MOCK_PROFILE: UserProfile = {
  name: "Alexander",
  age: 28,
  city: "Monte Carlo",
  profession: "Philanthropist",
  bio: "Curating a life of exceptional experiences and profound connections. I value authenticity, intellectual depth, and the quiet elegance of shared moments.",
  photos: [
    { id: "p1", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&h=800&auto=format&fit=crop", primary: true },
    { id: "p2", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&h=800&auto=format&fit=crop", primary: false },
    { id: "p3", url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600&h=800&auto=format&fit=crop", primary: false },
  ],
  verified: true,
};

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Edit fields */
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");
  const [age, setAge] = useState(18);

  const fetchProfile = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<any>("/profile");
      const serverProfile = data?.profile;
      const photos = Array.isArray(data?.photos)
        ? data.photos.map((photo: any, index: number) => ({
          id: photo.id ?? `${index}`,
          url: photo.url,
          primary: index === 0,
        }))
        : [];

      if (!serverProfile) {
        setProfile(MOCK_PROFILE);
        return;
      }

      setProfile({
        name: String(serverProfile.name ?? ""),
        age: Number(serverProfile.age ?? 18),
        city: String(serverProfile.city ?? ""),
        profession: String(serverProfile.profession ?? ""),
        bio: String(serverProfile.bioShort ?? ""),
        photos: photos.length ? photos : MOCK_PROFILE.photos,
        verified: data?.user?.videoVerificationStatus === "APPROVED",
      });
    } catch {
      setProfile(MOCK_PROFILE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio);
      setCity(profile.city);
      setProfession(profile.profession);
      setAge(profile.age);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: { name, age: Number(age), city, profession, bioShort: bio } as never,
      });
      setProfile((prev) => (prev ? { ...prev, name, bio, city, profession, age: Number(age) } : prev));
      setEditing(false);
      addToast("Your identity has been refined.", "success");
    } catch {
      addToast("Failed to curate profile updates.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    addToast("Gracefully signing out.", "info");
    router.push("/login"); // In real app use setAccessToken(null)
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto py-12 px-8 space-y-16">
      <div className="flex items-center gap-10">
        <Skeleton className="w-32 h-32 rounded-full" />
        <div className="space-y-4">
          <Skeleton className="h-14 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 space-y-10">
          <Skeleton className="h-[480px] w-full rounded-[3.5rem]" />
          <div className="grid grid-cols-2 gap-8">
            <Skeleton className="h-[280px] rounded-[2.5rem]" />
            <Skeleton className="h-[280px] rounded-[2.5rem]" />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-10">
          <Skeleton className="h-64 w-full rounded-[3rem]" />
          <Skeleton className="h-[400px] w-full rounded-[3rem]" />
        </div>
      </div>
    </div>
  );

  if (error || !profile) return <ErrorState onRetry={fetchProfile} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto py-12 px-8 pb-32 relative"
    >
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f6]">
        <div className="absolute top-[30%] right-[0%] w-[50%] h-[50%] bg-primary/[0.03] rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[0%] left-[0%] w-[40%] h-[40%] bg-primary/[0.03] rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Cinematic Header Section */}
      <header className="mb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-10">
            <div className="relative">
              <Avatar
                src={profile.photos[0]?.url}
                name={profile.name}
                size={112}
                className="ring-[6px] ring-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] rounded-[2.5rem]"
              />
              {profile.verified && (
                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-xl border border-primary/10">
                  <div className="bg-primary/20 p-1.5 rounded-xl">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-foreground/90 italic">
                {profile.name}, {profile.age}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">{profile.profession}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                <span className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">{profile.city}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="px-8 py-3 rounded-2xl text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 hover:text-red-400 border-black/[0.03] hover:bg-white"
            >
              Sign Out
            </Button>
            <Button
              variant="premium"
              onClick={() => setEditing(!editing)}
              className="px-10 py-3 rounded-2xl text-[10px] uppercase tracking-[0.4em] font-black shadow-2xl shadow-primary/20"
            >
              {editing ? "Cancel Refinement" : "Refine Identity"}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
        {/* Left Gallery - Column 3/5 */}
        <div className="lg:col-span-3 space-y-10">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40">Visual Monograph</h2>
            <Badge className="bg-primary/5 text-primary border-primary/10 text-[9px] uppercase tracking-[0.3em] font-black px-4 py-1.5 rounded-full">{profile.photos.length} Elements Captured</Badge>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {profile.photos.map((photo, idx) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8 }}
                className={`${idx === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[3/4]"
                  } relative rounded-[3.5rem] overflow-hidden group shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)] border border-white/60 bg-white/40 backdrop-blur-3xl`}
              >
                <img
                  src={photo.url}
                  className="w-full h-full object-cover transition-transform duration-[4s] ease-[0.16,1,0.3,1] group-hover:scale-110"
                  alt="Identity Piece"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                {photo.primary && (
                  <div className="absolute top-8 left-8">
                    <span className="bg-white/90 backdrop-blur-2xl text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2.5 rounded-full text-foreground/80 shadow-2xl border border-white/60">Featured Element</span>
                  </div>
                )}
              </motion.div>
            ))}

            <motion.button
              whileHover={{ scale: 0.98 }}
              className="aspect-[3/4] border-2 border-dashed border-primary/20 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 group transition-all duration-700 hover:bg-white/[0.2] hover:border-primary/40"
            >
              <div className="w-16 h-16 rounded-full bg-white/40 border border-primary/10 flex items-center justify-center text-primary/40 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-700">
                <span className="text-3xl font-light">+</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30 group-hover:text-primary/60">Capture Presence</span>
            </motion.button>
          </div>
        </div>

        {/* Right Details - Column 2/5 */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!editing ? (
              <motion.div
                key="view-mode"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-16 lg:sticky lg:top-32"
              >
                <section className="space-y-8">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 px-4">Narrative Essence</h2>
                  <div className="p-10 rounded-[3rem] bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-primary/30 to-transparent h-full" />
                    <p className="text-2xl md:text-3xl leading-[1.6] font-serif text-foreground/70 italic first-letter:text-7xl first-letter:mr-4 first-letter:float-left first-letter:text-primary/30 first-letter:font-serif first-letter:leading-[0.8] first-letter:mt-2">
                      {profile.bio}
                    </p>
                  </div>
                </section>

                <section className="space-y-8">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 px-4">Specifications</h2>
                  <div className="space-y-1">
                    <ProfileRow label="Role" value={profile.profession} />
                    <ProfileRow label="Base" value={profile.city} />
                    <ProfileRow label="Era" value={`${profile.age} Springs`} />
                    <ProfileRow label="Status" value="Verified Curation" last />
                  </div>
                </section>

                <Card className="p-12 bg-gradient-to-br from-primary/[0.08] to-transparent border-primary/10 rounded-[3.5rem] relative overflow-hidden group border-white/40 shadow-2xl">
                  <div className="relative z-10 space-y-10">
                    <div className="space-y-3">
                      <h3 className="text-3xl font-serif text-foreground/80 italic tracking-tight">Elite Membership</h3>
                      <p className="text-sm text-muted-foreground/50 leading-relaxed font-serif italic pr-8">Elevate your discovery frequency to the upper echelons of connection.</p>
                    </div>
                    <Button variant="premium" className="w-full py-7 rounded-[1.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black">Expand Influence</Button>
                  </div>
                  {/* Decorative blur elements for elite card */}
                  <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/20 rounded-full blur-[100px] group-hover:bg-primary/30 transition-all duration-1000" />
                  <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-primary/10 rounded-full blur-[80px]" />
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="edit-mode"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40">Refining Curation</h2>
                  <div className="w-12 h-[px] bg-primary/20" />
                </div>

                <Card className="p-10 space-y-10 bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3.5rem] shadow-2xl">
                  <Input label="Appellation" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
                  <div className="grid grid-cols-2 gap-8">
                    <Input label="Springs (Age)" type="number" value={String(age)} onChange={(e) => setAge(Number(e.target.value))} />
                    <Input label="Domicile" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  </div>
                  <Input label="Trade" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Profession" />
                  <Textarea
                    label="The Narrative"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={300}
                    charCount={{ current: bio.length, max: 300 }}
                    className="min-h-[200px]"
                  />

                  <div className="pt-6 space-y-6">
                    <Button variant="premium" className="w-full py-7 rounded-[1.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black" loading={saving} onClick={handleSave}>
                      Seal Identity
                    </Button>
                    <Button variant="ghost" className="w-full py-5 rounded-[1.5rem] text-muted-foreground/30 hover:text-foreground/60 text-[10px] uppercase tracking-[0.4em] font-black transition-all duration-500 hover:bg-white" onClick={() => setEditing(false)}>
                      Discard Changes
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-6 ${!last ? "border-b border-primary/5" : ""} px-4 group hover:bg-primary/[0.01] transition-all duration-500 rounded-2xl`}>
      <span className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 italic">{label}</span>
      <span className="text-sm font-serif italic text-foreground/60 tracking-tight group-hover:text-primary transition-colors duration-500">{value}</span>
    </div>
  );
}
