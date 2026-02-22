"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { ApiError, apiFetch } from "@/lib/api";
import { useSession } from "@/lib/session";

const STEPS = ["Photo", "Basics", "About", "Intent", "Review"] as const;

type WizardData = {
  photoUrl: string;
  name: string;
  age: string;
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER" | "";
  city: string;
  profession: string;
  bio: string;
  intent: "dating" | "friends" | "all";
};

const initialData: WizardData = {
  photoUrl: "",
  name: "",
  age: "",
  gender: "",
  city: "",
  profession: "",
  bio: "",
  intent: "dating"
};

export default function ProfileWizardPage() {
  const { refresh } = useSession();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<WizardData>(initialData);

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const step = STEPS[currentStep];

  const updateField = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
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
        if (!dataUrl.startsWith("data:image/")) {
          throw new Error("invalid-data-url");
        }
        const response = await apiFetch<{ photo?: { url: string } }>("/photos/upload", {
          method: "POST",
          body: { filename: file.name, dataUrl } as never
        });
        updateField("photoUrl", response.photo?.url ?? "");
        addToast("Photo uploaded", "success");
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to upload photo";
        addToast(message, "error");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploading(false);
      addToast("Failed to read image", "error");
    };
    reader.readAsDataURL(file);
  };

  const canProceed = () => {
    switch (step) {
      case "Photo":
        return Boolean(data.photoUrl);
      case "Basics":
        return Boolean(data.name && data.age && data.gender && data.city && data.profession);
      case "About":
        return data.bio.trim().length >= 10;
      case "Intent":
        return Boolean(data.intent);
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    if (!canProceed()) {
      addToast("Please complete required fields", "error");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: {
          name: data.name.trim(),
          age: Number(data.age),
          gender: data.gender,
          city: data.city.trim(),
          profession: data.profession.trim(),
          bioShort: data.bio.trim(),
          intent: data.intent
        } as never
      });

      await apiFetch("/profile/complete", { method: "POST" });
      await refresh();
      window.location.href = "/discover";
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to save profile";
      addToast(message, "error");
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div
      style={{
        paddingBottom: 28,
        maxWidth: 640,
        margin: "0 auto"
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Build Your Profile</h1>
      <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 18 }}>
        Step {currentStep + 1} of {STEPS.length}: {step}
      </p>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "color-mix(in srgb, var(--border) 74%, transparent)",
          overflow: "hidden",
          marginBottom: 24,
          border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--border))"
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--accent-deep) 68%, transparent), color-mix(in srgb, var(--accent-light) 75%, transparent))",
            transition: reducedMotion ? "none" : "width 260ms ease"
          }}
        />
      </div>

      <Card
        style={{
          padding: 20,
          marginBottom: 16,
          border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
          background: "linear-gradient(145deg, color-mix(in srgb, var(--surface2) 92%, var(--accent) 8%), var(--panel))"
        }}
      >
        <div
          key={step}
          style={{
            animation: reducedMotion ? "none" : "stepEnter 200ms ease",
            transform: "translateZ(0)"
          }}
        >
          {step === "Photo" && (
            <div>
              <h3 style={{ marginBottom: 8 }}>Upload your photo</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
                We support one profile photo.
              </p>
              <label
                htmlFor="profile-photo-input"
                style={{
                  display: "block",
                  border: "2px dashed var(--border)",
                  borderRadius: 16,
                  padding: 12,
                  cursor: "pointer"
                }}
              >
                {data.photoUrl ? (
                  <img
                    src={data.photoUrl}
                    alt="Profile preview"
                    style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 12 }}
                  />
                ) : (
                  <div
                    style={{
                      minHeight: 220,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--muted)",
                      fontWeight: 600
                    }}
                  >
                    Tap to upload a photo
                  </div>
                )}
              </label>
              <input id="profile-photo-input" type="file" accept="image/*" onChange={handleUploadPhoto} style={{ marginTop: 12 }} />
              {uploading && <p style={{ color: "var(--muted)", marginTop: 8 }}>Uploading...</p>}
            </div>
          )}

          {step === "Basics" && (
            <div style={{ display: "grid", gap: 12 }}>
              <Input label="Name" value={data.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Your name" />
              <Input label="Age" type="number" min="18" max="99" value={data.age} onChange={(e) => updateField("age", e.target.value)} />
              <Select
                label="Gender"
                value={data.gender}
                onChange={(e) => updateField("gender", e.target.value as WizardData["gender"])}
                placeholder="Select gender"
                options={[
                  { value: "MALE", label: "Male" },
                  { value: "FEMALE", label: "Female" },
                  { value: "NON_BINARY", label: "Non-binary" },
                  { value: "OTHER", label: "Other" }
                ]}
              />
              <Input label="City" value={data.city} onChange={(e) => updateField("city", e.target.value)} />
              <Input label="Profession" value={data.profession} onChange={(e) => updateField("profession", e.target.value)} />
            </div>
          )}

          {step === "About" && (
            <Textarea
              label="Bio"
              rows={5}
              value={data.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              maxLength={300}
              charCount={{ current: data.bio.length, max: 300 }}
            />
          )}

          {step === "Intent" && (
            <Select
              label="Intent"
              value={data.intent}
              onChange={(e) => updateField("intent", e.target.value as WizardData["intent"])}
              options={[
                { value: "dating", label: "Dating" },
                { value: "friends", label: "Friends" },
                { value: "all", label: "Open to anything" }
              ]}
            />
          )}

          {step === "Review" && (
            <div style={{ display: "grid", gap: 10 }}>
              <Review label="Photo" value={data.photoUrl ? "Uploaded" : "Missing"} />
              <Review label="Name" value={data.name} />
              <Review label="Age" value={data.age} />
              <Review label="Gender" value={data.gender} />
              <Review label="City" value={data.city} />
              <Review label="Profession" value={data.profession} />
              <Review label="Bio" value={data.bio} />
              <Review label="Intent" value={data.intent} />
            </div>
          )}
        </div>
      </Card>

      <div className="safe-bottom" style={{ display: "flex", gap: 10 }}>
        {currentStep > 0 && (
          <Button variant="secondary" fullWidth size="lg" onClick={() => setCurrentStep((v) => v - 1)}>
            Back
          </Button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <Button fullWidth size="lg" onClick={() => setCurrentStep((v) => v + 1)} disabled={!canProceed() || uploading}>
            Continue
          </Button>
        ) : (
          <Button fullWidth size="lg" loading={loading} onClick={handleComplete}>
            Complete Profile
          </Button>
        )}
      </div>

      <style jsx>{`
        @keyframes stepEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}
