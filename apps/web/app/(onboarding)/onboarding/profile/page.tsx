"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { Badge, Chip } from "@/app/components/ui/Badge";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

const STEPS = ["Photos", "Basics", "About", "Interests", "Preferences", "Review"] as const;
type Step = (typeof STEPS)[number];

const ALL_INTERESTS = [
  "Travel", "Fitness", "Music", "Cooking", "Reading", "Photography",
  "Movies", "Art", "Hiking", "Gaming", "Yoga", "Dancing",
  "Coffee", "Wine", "Sports", "Tech", "Fashion", "Volunteering",
];

export default function ProfileWizardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  /* Form data */
  const [photos, setPhotos] = useState<{ id: string; url: string; primary: boolean }[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [intent, setIntent] = useState("dating");
  const [distance, setDistance] = useState(50);

  const step = STEPS[currentStep];

  const handleAddPhoto = useCallback(() => {
    if (photos.length >= 6) return;
    const id = Math.random().toString(36).slice(2, 8);
    const newPhoto = {
      id,
      url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999999)}?q=80&w=600&h=800&auto=format&fit=crop`,
      primary: photos.length === 0,
    };
    setPhotos((p) => [...p, newPhoto]);
    addToast("Liaison photo added.", "success");
  }, [photos, addToast]);

  const handleRemovePhoto = useCallback((id: string) => {
    setPhotos((p) => {
      const filtered = p.filter((ph) => ph.id !== id);
      if (filtered.length > 0 && !filtered.some((ph) => ph.primary)) {
        filtered[0].primary = true;
      }
      return filtered;
    });
  }, []);

  const handleSetPrimary = useCallback((id: string) => {
    setPhotos((p) =>
      p.map((ph) => ({ ...ph, primary: ph.id === id }))
    );
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }, []);

  const canProceed = () => {
    switch (step) {
      case "Photos": return photos.length >= 1;
      case "Basics": return name && age && gender && city;
      case "About": return bio.length >= 10;
      case "Interests": return interests.length >= 3;
      default: return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: { name, age: Number(age), gender: gender.toUpperCase(), city, profession, bioShort: bio, preferences: { interests, intent, distance }, genderPreference: "ALL" } as never,
      });
      await apiFetch("/profile/complete", { method: "POST" });
      addToast("Your identity is established.", "success");
      router.push("/discover");
    } catch {
      addToast("Failed to authenticate session details.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-8 relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f6]">
        <div className="absolute top-[20%] right-[0%] w-[50%] h-[50%] bg-primary/[0.03] rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[0%] w-[40%] h-[40%] bg-primary/[0.03] rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <header className="space-y-8 text-center mb-16">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-serif text-foreground tracking-tight italic">
            Forge Your Identity
          </h1>
          <p className="text-[10px] uppercase tracking-[0.5em] font-black italic text-primary/40">
            Stage {currentStep + 1} of {STEPS.length} — {step}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-3 h-1.5 px-12 max-w-lg mx-auto">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-1000 ease-[0.16,1,0.3,1] ${i <= currentStep
                ? "bg-primary shadow-[0_0_15px_rgba(232,165,178,0.4)] scale-y-110"
                : "bg-primary/10"
                }`}
            />
          ))}
        </div>
      </header>

      <div className="min-h-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -30 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="p-10 md:p-14 bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.08)] rounded-[3.5rem] relative overflow-hidden group">
              {/* Step: Photos */}
              {step === "Photos" && (
                <div className="space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif italic text-foreground/80 tracking-tight">Visual Curations</h3>
                    <p className="text-sm text-muted-foreground/50 leading-relaxed font-serif italic">Add up to 6 high-fidelity photos that reflect your essence and aesthetic.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border-2 transition-all duration-700 shadow-md ${photo.primary ? "border-primary scale-[1.02] shadow-2xl shadow-primary/10" : "border-white/60"
                          }`}
                      >
                        <img
                          src={photo.url}
                          alt="Elite Identity"
                          className="w-full h-full object-cover transition-transform duration-[4s] ease-[0.16,1,0.3,1] group-hover:scale-110"
                        />
                        {photo.primary && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-white/90 backdrop-blur-xl border-none text-[8px] text-primary uppercase tracking-[0.2em] font-black px-3 py-1.5 rounded-xl shadow-lg">Primary</Badge>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-3">
                          {!photo.primary && (
                            <button
                              onClick={() => handleSetPrimary(photo.id)}
                              className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md text-primary flex items-center justify-center hover:scale-110 transition-transform duration-500 shadow-xl"
                            >
                              <span className="text-lg">★</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md text-red-500 flex items-center justify-center hover:scale-110 transition-transform duration-500 shadow-xl"
                          >
                            <span className="text-lg">✕</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {photos.length < 6 && (
                      <button
                        onClick={handleAddPhoto}
                        className="aspect-[3/4] rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center gap-6 text-primary hover:bg-primary/[0.05] hover:border-primary/40 transition-all duration-700 group"
                      >
                        <div className="w-16 h-16 rounded-full border border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-700 text-3xl font-light shadow-inner">
                          +
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.4em] font-black opacity-30 group-hover:opacity-100 transition-all duration-700 italic border-b border-primary/10 pb-1">Capture Presence</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Step: Basics */}
              {step === "Basics" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif italic text-foreground/80 tracking-tight">Fundamental Origins</h3>
                    <p className="text-sm text-muted-foreground/50 leading-relaxed font-serif italic">Define the basic parameters of your identity and base.</p>
                  </div>
                  <div className="space-y-10">
                    <Input label="Appellation" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
                    <div className="grid grid-cols-2 gap-8">
                      <Input label="Era (Age)" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" />
                      <Select
                        label="Identity"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        placeholder="Select"
                        options={[
                          { value: "male", label: "Masculine" },
                          { value: "female", label: "Feminine" },
                          { value: "non-binary", label: "Neutral" },
                          { value: "other", label: "Fluid" },
                        ]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <Input label="Domicile" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                      <Input label="Vocation" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Profession" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step: About */}
              {step === "About" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif italic text-foreground/80 tracking-tight">Narrative Essence</h3>
                    <p className="text-sm text-muted-foreground/50 leading-relaxed font-serif italic">Craft an editorial summary of your life's journey and motivations.</p>
                  </div>
                  <Textarea
                    label="The Narrative"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your essence in a few chosen words..."
                    className="min-h-[240px]"
                    maxLength={300}
                    charCount={{ current: bio.length, max: 300 }}
                  />
                </div>
              )}

              {/* Step: Interests */}
              {step === "Interests" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif italic text-foreground/80 tracking-tight">Personal Affinity</h3>
                    <p className="text-sm text-muted-foreground/50 leading-relaxed font-serif italic">Select 3 or more nodes of interest to cultivate resonance.</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {ALL_INTERESTS.map((interest) => (
                      <div
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`cursor-pointer transition-all duration-700`}
                      >
                        <Chip
                          label={interest}
                          selected={interests.includes(interest)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step: Preferences */}
              {step === "Preferences" && (
                <div className="space-y-14">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif italic text-foreground/80 tracking-tight">Liaison Preferences</h3>
                    <p className="text-sm text-muted-foreground/50 leading-relaxed font-serif italic">Define the nature and range of your discovery terminal.</p>
                  </div>

                  <div className="space-y-12">
                    <Select
                      label="Primary Intent"
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      options={[
                        { value: "dating", label: "Romantic Liaison" },
                        { value: "friends", label: "Platonic Alliance" },
                        { value: "all", label: "Open Exploration" },
                      ]}
                    />

                    <div className="space-y-10 group">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/40 italic">Discovery Radius</label>
                        <span className="text-3xl font-serif italic text-foreground/80 group-hover:text-primary transition-colors duration-1000">{distance} <span className="text-[10px] uppercase tracking-[0.2em] font-black">KM</span></span>
                      </div>
                      <div className="relative h-2 w-full bg-primary/5 rounded-full overflow-hidden">
                        <input
                          type="range"
                          min={5}
                          max={200}
                          value={distance}
                          onChange={(e) => setDistance(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full accent-primary appearance-none cursor-pointer bg-transparent"
                        />
                        <div className="absolute top-0 left-0 h-full bg-primary/20 pointer-events-none" style={{ width: `${(distance - 5) / 195 * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Review */}
              {step === "Review" && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif italic text-foreground/80 tracking-tight">Final Verification</h3>
                    <p className="text-sm text-muted-foreground/50 leading-relaxed font-serif italic">Verify your profile summary for authentication into the collective.</p>
                  </div>

                  <div className="space-y-2 border-t border-primary/5 pt-10">
                    <ReviewField label="Visual Content" value={`${photos.length} Captured Elements`} />
                    <ReviewField label="Appellation" value={name} />
                    <ReviewField label="Era / Location" value={`${age} Years • ${city}`} />
                    <ReviewField label="Trade" value={profession} />
                    <div className="py-8 border-b border-primary/5 group transition-all duration-700 hover:bg-primary/[0.01] px-4 rounded-3xl">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-primary/30 mb-6 font-black italic">The Narrative</p>
                      <p className="text-lg md:text-xl text-foreground/70 font-serif italic leading-relaxed">&ldquo;{bio}&rdquo;</p>
                    </div>
                    <div className="py-8 px-4">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-primary/30 mb-6 font-black italic">Affinities</p>
                      <div className="flex flex-wrap gap-2.5">
                        {interests.map(i => <Badge key={i} className="bg-primary/5 border-none text-primary/60 text-[9px] uppercase font-black tracking-widest px-4 py-2 rounded-xl">{i}</Badge>)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cinematic card gradient glow */}
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-primary/[0.03] to-transparent pointer-events-none" />
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <footer className="flex flex-col md:flex-row gap-6 mt-12 px-2">
        {currentStep > 0 && (
          <Button
            variant="ghost"
            className="flex-1 py-7 text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 hover:text-foreground border-black/[0.03] hover:bg-white rounded-[1.5rem]"
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            Previous Stage
          </Button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <Button
            variant="premium"
            className="flex-[2] py-7 text-[10px] uppercase tracking-[0.4em] font-black rounded-[1.5rem] shadow-2xl shadow-primary/20"
            disabled={!canProceed()}
            onClick={() => setCurrentStep((s) => s + 1)}
          >
            Continue Discovery
          </Button>
        ) : (
          <Button
            variant="premium"
            className="flex-[2] py-7 text-[10px] uppercase tracking-[0.4em] font-black rounded-[1.5rem] shadow-2xl shadow-primary/30"
            loading={loading}
            onClick={handleComplete}
          >
            Finalize Identity
          </Button>
        )}
      </footer>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-6 border-b border-primary/5 px-4 group hover:bg-primary/[0.01] transition-all duration-700 rounded-3xl">
      <span className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/30 italic">{label}</span>
      <span className="text-sm text-foreground/60 font-serif italic tracking-tight group-hover:text-primary transition-colors duration-700">{value}</span>
    </div>
  );
}

