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
type Step = (typeof STEPS)[number];

const ALL_INTERESTS = ["Travel", "Fitness", "Music", "Cooking", "Reading", "Photography", "Movies", "Art", "Hiking", "Gaming", "Yoga", "Dancing"];

export default function ProfileWizardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

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
      const dataUrl = String(reader.result ?? "");
      try {
        const result = await apiFetch<{ photo: { id: string; url: string } }>("/photos/upload", {
          method: "POST",
          body: { filename: file.name, dataUrl } as never,
        });
        setPhotos((prev) => [...prev, { id: result.photo.id, url: result.photo.url, primary: prev.length === 0 }]);
        addToast("Photo uploaded.", "success");
      } catch (error) {
        addToast(error instanceof Error ? error.message : "Upload failed", "error");
      }
    };
    reader.readAsDataURL(file);
  }, [addToast]);

  const toggleInterest = useCallback((interest: string) => {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]));
  }, []);

  const canProceed = () => {
    if (step === "Photos") return photos.length >= 1;
    if (step === "Basics") return Boolean(name && age && gender && city && profession);
    if (step === "About") return bio.length >= 10;
    if (step === "Interests") return interests.length >= 2;
    return true;
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: {
          displayName: name,
          age: Number(age),
          gender,
          genderPreference: "ALL",
          city,
          profession,
          bioShort: bio,
          preferences: { interests }
        } as never,
      });
      await apiFetch("/profile/complete", { method: "POST" });
      addToast("Profile complete!", "success");
      router.push("/app");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to save profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: 8 }}>Build Your Profile</h1>
      <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 24 }}>Step {currentStep + 1} of {STEPS.length}: {step}</p>
      <Card style={{ padding: 28, marginBottom: 24 }}>
        {step === "Photos" && <div><h3>Add Photos</h3><input type="file" accept="image/*" onChange={(e) => void handleAddPhoto(e.target.files?.[0])} /><div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)", gap:12, marginTop:12}}>{photos.map((photo)=><img key={photo.id} src={photo.url} alt="Profile" style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",borderRadius:12}} />)}</div></div>}
        {step === "Basics" && <div style={{ display:"flex", flexDirection:"column", gap: 16 }}><Input label="Name" value={name} onChange={(e)=>setName(e.target.value)} /><Input label="Age" type="number" value={age} onChange={(e)=>setAge(e.target.value)} /><Select label="Gender" value={gender} onChange={(e)=>setGender(e.target.value)} options={[{value:"MALE",label:"Male"},{value:"FEMALE",label:"Female"},{value:"NON_BINARY",label:"Non-binary"},{value:"OTHER",label:"Other"}]} /><Input label="City" value={city} onChange={(e)=>setCity(e.target.value)} /><Input label="Profession" value={profession} onChange={(e)=>setProfession(e.target.value)} /></div>}
        {step === "About" && <Textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows={5} maxLength={300} charCount={{current: bio.length, max: 300}} />}
        {step === "Interests" && <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{ALL_INTERESTS.map((interest)=><Chip key={interest} label={interest} selected={interests.includes(interest)} onClick={()=>toggleInterest(interest)} />)}</div>}
        {step === "Review" && <div><p>{name}, {age}</p><p>{city} · {profession}</p><p>{bio}</p></div>}
      </Card>
      <div style={{ display: "flex", gap: 12 }}>
        {currentStep > 0 && <Button variant="secondary" fullWidth onClick={() => setCurrentStep((s) => s - 1)}>Back</Button>}
        {currentStep < STEPS.length - 1 ? <Button fullWidth disabled={!canProceed()} onClick={() => setCurrentStep((s) => s + 1)}>Continue</Button> : <Button fullWidth loading={loading} onClick={handleComplete}>Complete Profile</Button>}
      </div>
    </div>
  );
}
