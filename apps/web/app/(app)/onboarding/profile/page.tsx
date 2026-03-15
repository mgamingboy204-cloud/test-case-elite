"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "OTHER";

type ProfileResponse = {
  profile?: {
    name?: string | null;
    dateOfBirth?: string | null;
    gender?: Gender | null;
    heightCm?: number | null;
    profession?: string | null;
    city?: string | null;
    bioShort?: string | null;
  } | null;
};

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 240;

function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export default function OnboardingProfileDetailsPage() {
  const { completeOnboardingStep, refreshCurrentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [profession, setProfession] = useState("");
  const [place, setPlace] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<ProfileResponse>("/profile", { auth: true });
        const profile = data.profile;
        if (!profile) return;
        setName(profile.name ?? "");
        setDateOfBirth(profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "");
        setGender(profile.gender ?? "");
        setHeightCm(profile.heightCm ? String(profile.heightCm) : "");
        setProfession(profile.profession ?? "");
        setPlace(profile.city ?? "");
        setBio(profile.bioShort ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const age = useMemo(() => (dateOfBirth ? calculateAge(dateOfBirth) : null), [dateOfBirth]);

  const validationError = useMemo(() => {
    if (name.trim().length < 2) return "Please enter your full name.";
    if (!dateOfBirth) return "Please select your date of birth.";
    if ((age ?? 0) < 18) return "Members must be at least 18 years old.";
    if (!gender) return "Please select your gender.";
    const parsedHeight = Number(heightCm);
    if (!Number.isFinite(parsedHeight) || parsedHeight < MIN_HEIGHT || parsedHeight > MAX_HEIGHT) {
      return `Height must be between ${MIN_HEIGHT} cm and ${MAX_HEIGHT} cm.`;
    }
    if (profession.trim().length < 2) return "Please enter your profession.";
    if (place.trim().length < 2) return "Please enter your place.";
    if (bio.trim().length < 20) return "Please write a short bio (minimum 20 characters).";
    return "";
  }, [age, bio, dateOfBirth, gender, heightCm, name, place, profession]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationError || !age) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/profile", {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          name: name.trim(),
          dateOfBirth,
          gender,
          heightCm: Number(heightCm),
          age,
          profession: profession.trim(),
          city: place.trim(),
          place: place.trim(),
          bioShort: bio.trim(),
          bio: bio.trim(),
          intent: "dating"
        })
      });
      await refreshCurrentUser();
      setSuccess("Profile details saved.");
      completeOnboardingStep("PHOTOS");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save details. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-foreground/50">Loading your profile details…</div>;
  }

  return (
    <div className="flex h-full flex-col px-8 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">
      <div className="pt-6 pb-6">
        <h1 className="text-4xl font-serif text-foreground tracking-wide">Profile <span className="text-primary">Details</span></h1>
        <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-foreground/40">Mandatory before photo upload</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4">
        <Input label="Name" value={name} onChange={setName} placeholder="Full name" />
        <Input label="Date of birth" type="date" value={dateOfBirth} onChange={setDateOfBirth} />
        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-foreground/50">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className="w-full rounded-xl border border-primary/20 bg-transparent px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="NON_BINARY">Non-binary</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <Input label="Height (cm)" value={heightCm} onChange={setHeightCm} placeholder="e.g. 172" inputMode="numeric" />
        <Input label="Profession" value={profession} onChange={setProfession} placeholder="e.g. Founder" />
        <Input label="Place" value={place} onChange={setPlace} placeholder="City, Country" />

        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-foreground/50">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-primary/20 bg-transparent px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
            placeholder="Share a concise introduction."
          />
        </div>

        <div className="mt-auto space-y-2">
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          {!error && success ? <p className="text-xs text-emerald-400">{success}</p> : null}
          {!error && !success && validationError ? <p className="text-xs text-amber-300">{validationError}</p> : null}
          <button
            type="submit"
            disabled={Boolean(validationError) || saving}
            className={`btn-vael-primary ${validationError || saving ? "cursor-not-allowed opacity-30 grayscale" : ""}`}
          >
            {saving ? "Saving…" : "Continue to Photo Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-foreground/50">{props.label}</label>
      <input
        type={props.type ?? "text"}
        inputMode={props.inputMode}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full rounded-xl border border-primary/20 bg-transparent px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}
