"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { Chip } from "@/app/components/ui/Badge";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

const STEPS = ["Photos", "Basics", "About", "Interests", "Review"] as const;
const ALL_INTERESTS = ["Travel", "Fitness", "Music", "Cooking", "Reading", "Photography", "Movies", "Art", "Hiking", "Gaming", "Yoga", "Dancing"];

export default function ProfileWizardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openWhy, setOpenWhy] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; url: string; primary: boolean }[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("18");
  const [gender, setGender] = useState("OTHER");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const step = STEPS[currentStep];

  const handleAddPhoto = useCallback(async (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await apiFetch<{ photo: { id: string; url: string } }>("/photos/upload", { method: "POST", body: { filename: file.name, dataUrl: String(reader.result ?? "") } as never });
        setPhotos((prev) => [...prev, { id: result.photo.id, url: result.photo.url, primary: prev.length === 0 }]);
      } catch { addToast("Upload failed", "error"); }
    };
    reader.readAsDataURL(file);
  }, [addToast]);

  const canProceed = () => (step === "Photos" ? photos.length >= 1 : step === "Basics" ? Boolean(name && age && gender && city && profession) : step === "About" ? bio.length >= 10 : step === "Interests" ? interests.length >= 2 : true);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiFetch("/profile", { method: "PUT", body: { displayName: name, age: Number(age), gender, genderPreference: "ALL", city, profession, bioShort: bio, preferences: { interests } } as never });
      await apiFetch("/profile/complete", { method: "POST" });
      router.push("/app");
    } catch { addToast("Failed to save profile", "error"); } finally { setLoading(false); }
  };

  return (
    <div className="fade-in ds-page" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="stepper">
        {STEPS.slice(0, 5).map((_, idx) => (
          <div key={idx} style={{ display: "contents" }}>
            <div className={`stepper__dot ${idx < currentStep ? "is-complete" : idx === currentStep ? "is-active" : ""}`}>{idx < currentStep ? "✓" : idx + 1}</div>
            {idx < 4 && <div className="stepper__line" />}
          </div>
        ))}
      </div>
      <h1 className="ds-title">Complete your profile</h1>
      <p className="ds-subtitle" style={{ marginBottom: 20 }}>Step {currentStep + 1} of {STEPS.length}: {step}</p>
      <Card style={{ padding: 24, borderRadius: 24 }}>
        <button type="button" onClick={() => setOpenWhy((v) => !v)} style={{ marginBottom: 16, color: "var(--muted)", fontSize: 14 }}>Why this is required</button>
        {openWhy ? <ul style={{ listStyle: "disc", marginLeft: 20, marginBottom: 16, color: "var(--muted)", fontSize: 14 }}><li>Verified details improve trust.</li><li>Structured profiles create better introductions.</li><li>Confidential controls protect members.</li></ul> : null}

        {step === "Photos" && <div><h3>Add photos</h3><input aria-label="Upload photo" type="file" accept="image/*" onChange={(e) => void handleAddPhoto(e.target.files?.[0])} /><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 12 }}>{photos.map((photo) => <img key={photo.id} src={photo.url} alt="Profile" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 12 }} />)}</div></div>}
        {step === "Basics" && <div style={{ display: "grid", gap: 16 }}><Input label="Name" value={name} onChange={(e) => setName(e.target.value)} /><Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} /><Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)} options={[{ value: "MALE", label: "Male" }, { value: "FEMALE", label: "Female" }, { value: "NON_BINARY", label: "Non-binary" }, { value: "OTHER", label: "Other" }]} /><Input label="City" value={city} onChange={(e) => setCity(e.target.value)} /><Input label="Role" value={profession} onChange={(e) => setProfession(e.target.value)} /></div>}
        {step === "About" && <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} maxLength={300} charCount={{ current: bio.length, max: 300 }} />}
        {step === "Interests" && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{ALL_INTERESTS.map((interest) => <Chip key={interest} label={interest} selected={interests.includes(interest)} onClick={() => setInterests((p) => p.includes(interest) ? p.filter((i) => i !== interest) : [...p, interest])} />)}</div>}
        {step === "Review" && <div><p>{name}, {age}</p><p>{city} · {profession}</p><p>{bio}</p></div>}
      </Card>
      <div className="mobile-sticky-cta" style={{ display: "flex", gap: 12 }}>
        {currentStep > 0 && <Button variant="secondary" size="md" fullWidth onClick={() => setCurrentStep((s) => s - 1)}>Back</Button>}
        {currentStep < STEPS.length - 1 ? <Button size="md" fullWidth disabled={!canProceed()} onClick={() => setCurrentStep((s) => s + 1)}>Continue</Button> : <Button size="md" fullWidth loading={loading} onClick={handleComplete}>Complete profile</Button>}
      </div>
    </div>
  );
}
