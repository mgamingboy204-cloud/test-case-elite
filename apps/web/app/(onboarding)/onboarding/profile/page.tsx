"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { ApiError, apiFetch } from "@/lib/api";
import { INITIAL_PROFILE_DRAFT, ONBOARDING_PROFILE_FIELDS, type ProfileDraft } from "@/lib/onboardingFlow";
import { useSession } from "@/lib/session";

const DRAFT_KEY = "em_onboarding_profile_draft";

const STEP_IDS = ONBOARDING_PROFILE_FIELDS.filter((step) => step.stepId !== "welcome").map((step) => step.stepId);

export default function ProfileWizardPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(INITIAL_PROFILE_DRAFT);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<ProfileDraft>;
      setDraft({ ...INITIAL_PROFILE_DRAFT, ...parsed });
    } catch {
      setDraft(INITIAL_PROFILE_DRAFT);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const stepId = STEP_IDS[currentStep] ?? STEP_IDS[0];
  const currentField = useMemo(
    () => ONBOARDING_PROFILE_FIELDS.find((step) => step.stepId === stepId),
    [stepId]
  );

  const progress = ((currentStep + 1) / STEP_IDS.length) * 100;

  const updateDraft = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const canContinue = () => {
    switch (stepId) {
      case "photo":
        return Boolean(draft.photoUrl);
      case "displayName":
        return draft.displayName.trim().length > 0;
      case "gender":
        return Boolean(draft.gender);
      case "age":
        return Number(draft.age) >= 18;
      case "city":
        return draft.city.trim().length > 0;
      case "profession":
        return draft.profession.trim().length > 0;
      case "bioShort":
        return draft.bioShort.trim().length >= 10;
      default:
        return true;
    }
  };

  const handleUploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addToast("Please choose a valid image file", "error");
      return;
    }

    const reader = new FileReader();
    setUploading(true);
    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result ?? "");
        const response = await apiFetch<{ photo?: { url: string } }>("/photos/upload", {
          method: "POST",
          body: { filename: file.name, dataUrl } as never
        });
        updateDraft("photoUrl", response.photo?.url ?? "");
        addToast("Photo uploaded", "success");
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to upload photo";
        addToast(message, "error");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: {
          displayName: draft.displayName.trim(),
          age: Number(draft.age),
          gender: draft.gender,
          city: draft.city.trim(),
          profession: draft.profession.trim(),
          bioShort: draft.bioShort.trim(),
          intent: draft.intent
        } as never
      });

      await apiFetch("/profile/complete", { method: "POST" });
      window.localStorage.removeItem(DRAFT_KEY);
      await refresh();
      router.replace("/discover");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to complete profile";
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!canContinue()) return;
    if (currentStep === STEP_IDS.length - 1) {
      await handleFinalSubmit();
      return;
    }
    setCurrentStep((value) => value + 1);
  };

  const renderStep = () => {
    switch (stepId) {
      case "photo":
        return (
          <>
            <h1>Choose your best photo</h1>
            <p className="onboarding-muted">Profiles with clear photos get more matches.</p>
            <label htmlFor="profile-photo" className="onboarding-photo-drop">
              {draft.photoUrl ? <img src={draft.photoUrl} alt="Profile" className="onboarding-photo-preview" /> : <span>Tap to upload</span>}
            </label>
            <input id="profile-photo" type="file" accept="image/*" onChange={handleUploadPhoto} />
            {uploading ? <p className="onboarding-muted">Uploading…</p> : null}
          </>
        );
      case "displayName":
        return <Input label="Display name" value={draft.displayName} onChange={(event) => updateDraft("displayName", event.target.value)} placeholder="How people should see you" />;
      case "gender":
        return (
          <Select
            label="Gender"
            value={draft.gender}
            onChange={(event) => updateDraft("gender", event.target.value as ProfileDraft["gender"])}
            placeholder="Select one"
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "NON_BINARY", label: "Non-binary" },
              { value: "OTHER", label: "Other" }
            ]}
          />
        );
      case "age":
        return <Input label="Age" type="number" min="18" max="99" value={draft.age} onChange={(event) => updateDraft("age", event.target.value)} />;
      case "city":
        return <Input label="City" value={draft.city} onChange={(event) => updateDraft("city", event.target.value)} />;
      case "profession":
        return <Input label="Profession" value={draft.profession} onChange={(event) => updateDraft("profession", event.target.value)} />;
      case "bioShort":
        return <Textarea label="Short bio" rows={5} value={draft.bioShort} onChange={(event) => updateDraft("bioShort", event.target.value)} />;
      case "intent":
        return (
          <Select
            label="What are you looking for?"
            value={draft.intent}
            onChange={(event) => updateDraft("intent", event.target.value as ProfileDraft["intent"])}
            options={[
              { value: "dating", label: "Dating" },
              { value: "friends", label: "Friends" },
              { value: "all", label: "Open to anything" }
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-screen">
      <header className="onboarding-topbar">
        <button className="onboarding-icon-btn" onClick={() => (currentStep === 0 ? router.push("/onboarding/start") : setCurrentStep((value) => value - 1))} aria-label="Back">
          ←
        </button>
        <div className="onboarding-progress-track"><div className="onboarding-progress-fill" style={{ width: `${progress}%` }} /></div>
        {currentField?.allowsSkip ? (
          <button className="onboarding-skip-btn" onClick={handleNext}>Skip</button>
        ) : (
          <span className="onboarding-skip-placeholder" />
        )}
      </header>

      <section className="onboarding-scroll-area onboarding-content-stack">{renderStep()}</section>

      <footer className="onboarding-cta-shell">
        <Button fullWidth size="lg" onClick={handleNext} disabled={!canContinue() || uploading} loading={loading} className="onboarding-cta-btn">
          {currentStep === STEP_IDS.length - 1 ? "Complete profile" : "Continue"}
        </Button>
      </footer>
    </div>
  );
}
