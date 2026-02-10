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
      url: `https://picsum.photos/seed/${id}/400/500`,
      primary: photos.length === 0,
    };
    setPhotos((p) => [...p, newPhoto]);
    addToast("Photo added!", "success");
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
      case "Photos":
        return photos.length >= 1;
      case "Basics":
        return name && age && gender && city;
      case "About":
        return bio.length >= 10;
      case "Interests":
        return interests.length >= 3;
      case "Preferences":
        return true;
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: {
          name,
          displayName: name,
          age: Number(age),
          gender: gender === "male" ? "MALE" : gender === "female" ? "FEMALE" : gender === "non-binary" ? "NON_BINARY" : "OTHER",
          city,
          profession,
          bioShort: bio,
          preferences: { interests, intent, distance },
        } as never,
      });
      await apiFetch("/profile/complete", { method: "POST" });
      addToast("Profile complete!", "success");
      router.push("/discover");
    } catch {
      addToast("Failed to save profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: 8 }}>Build Your Profile</h1>
      <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 24 }}>
        Step {currentStep + 1} of {STEPS.length}: {step}
      </p>

      {/* Progress bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 32,
        }}
      >
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= currentStep ? "var(--primary)" : "var(--border)",
              transition: "background 300ms ease",
            }}
          />
        ))}
      </div>

      <Card style={{ padding: 28, marginBottom: 24 }}>
        {/* Photos Step */}
        {step === "Photos" && (
          <div>
            <h3 style={{ marginBottom: 4 }}>Add Photos</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              Upload up to 6 photos. First photo is your primary.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    position: "relative",
                    aspectRatio: "3/4",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: photo.primary ? "2px solid var(--primary)" : "1px solid var(--border)",
                  }}
                >
                  <img
                    src={photo.url || "/placeholder.svg"}
                    alt="Profile photo"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    crossOrigin="anonymous"
                  />
                  {photo.primary && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        background: "var(--primary)",
                        color: "#fff",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      PRIMARY
                    </span>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 6,
                      right: 6,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    {!photo.primary && (
                      <button
                        onClick={() => handleSetPrimary(photo.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          fontSize: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Set as primary"
                      >
                        {"\u2605"}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "rgba(220,38,38,0.8)",
                        color: "#fff",
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Remove"
                    >
                      {"\u2715"}
                    </button>
                  </div>
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  onClick={handleAddPhoto}
                  style={{
                    aspectRatio: "3/4",
                    borderRadius: "var(--radius-md)",
                    border: "2px dashed var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    color: "var(--muted)",
                    fontSize: 28,
                    background: "var(--bg)",
                    cursor: "pointer",
                    transition: "border-color 200ms",
                  }}
                >
                  +
                  <span style={{ fontSize: 11, fontWeight: 500 }}>Add Photo</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Basics Step */}
        {step === "Basics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ marginBottom: 0 }}>Basic Info</h3>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
            <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" min="18" max="99" />
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="Select gender"
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "non-binary", label: "Non-binary" },
                { value: "other", label: "Other" },
              ]}
            />
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
            <Input label="Profession" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Software Engineer" />
          </div>
        )}

        {/* About Step */}
        {step === "About" && (
          <div>
            <h3 style={{ marginBottom: 4 }}>About You</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
              Write a short bio to help others get to know you.
            </p>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={5}
              maxLength={300}
              charCount={{ current: bio.length, max: 300 }}
            />
          </div>
        )}

        {/* Interests Step */}
        {step === "Interests" && (
          <div>
            <h3 style={{ marginBottom: 4 }}>Your Interests</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
              Select at least 3 interests.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ALL_INTERESTS.map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  selected={interests.includes(interest)}
                  onClick={() => toggleInterest(interest)}
                />
              ))}
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
              {interests.length} selected
            </p>
          </div>
        )}

        {/* Preferences Step */}
        {step === "Preferences" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ marginBottom: 0 }}>Preferences</h3>
            <Select
              label="Intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              options={[
                { value: "dating", label: "Dating" },
                { value: "friends", label: "Friends" },
                { value: "all", label: "Open to anything" },
              ]}
            />
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: 8 }}>
                Discovery Distance: {distance} km
              </label>
              <input
                type="range"
                min={5}
                max={200}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--muted)",
                  marginTop: 4,
                }}
              >
                <span>5 km</span>
                <span>200 km</span>
              </div>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === "Review" && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Review Your Profile</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ReviewItem label="Photos" value={`${photos.length} photos`} />
              <ReviewItem label="Name" value={name || "Not set"} />
              <ReviewItem label="Age" value={age || "Not set"} />
              <ReviewItem label="Gender" value={gender || "Not set"} />
              <ReviewItem label="City" value={city || "Not set"} />
              <ReviewItem label="Profession" value={profession || "Not set"} />
              <ReviewItem label="Bio" value={bio || "Not set"} />
              <ReviewItem label="Interests" value={interests.join(", ") || "None"} />
              <ReviewItem label="Intent" value={intent} />
              <ReviewItem label="Distance" value={`${distance} km`} />
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12 }}>
        {currentStep > 0 && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            Back
          </Button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <Button
            fullWidth
            disabled={!canProceed()}
            onClick={() => setCurrentStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button fullWidth loading={loading} onClick={handleComplete}>
            Complete Profile
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
        gap: 16,
      }}
    >
      <span style={{ fontSize: 14, color: "var(--muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}
