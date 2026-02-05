"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { getAssetUrl } from "../../../lib/assets";
import { useSession } from "../../../lib/session";
import {
  buildDobString,
  getAgeFromDob,
  INTEREST_OPTIONS,
  parseDobString
} from "../../../lib/profileUtils";

type Status = "idle" | "loading" | "success" | "error";

type ProfileForm = {
  displayName: string;
  firstName: string;
  lastName: string;
  gender: string;
  genderPreference: string;
  age: string;
  city: string;
  profession: string;
  bioShort: string;
};

type StepId = "name" | "dob" | "gender" | "preferences" | "interests" | "photos" | "done";

type Step = {
  id: StepId;
  label: string;
  description: string;
};

const steps: Step[] = [
  { id: "name", label: "Name", description: "Personalize your profile basics." },
  { id: "dob", label: "DOB", description: "Let us calculate your visible age." },
  { id: "gender", label: "Gender", description: "Share how you identify." },
  { id: "preferences", label: "Preferences", description: "Tell us who you want to meet." },
  { id: "interests", label: "Interests", description: "Pick a few conversation starters." },
  { id: "photos", label: "Photos", description: "Add a standout first impression." },
  { id: "done", label: "Done", description: "You are ready to discover." }
];

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 5 * 1024 * 1024;
const preferenceDefaults = { intent: "serious", distance: "local" };

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [form, setForm] = useState<ProfileForm>({
    displayName: "",
    firstName: "",
    lastName: "",
    gender: "",
    genderPreference: "ALL",
    age: "",
    city: "",
    profession: "",
    bioShort: ""
  });
  const [preferences, setPreferences] = useState({ intent: "serious", distance: "local" });
  const [existingPreferences, setExistingPreferences] = useState<Record<string, any>>({});
  const [hasPreferenceUpdates, setHasPreferenceUpdates] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [dob, setDob] = useState({ year: "", month: "", day: "" });
  const [photos, setPhotos] = useState<any[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dobString = useMemo(() => buildDobString(dob), [dob]);
  const agePreview = useMemo(() => (dobString ? getAgeFromDob(dobString) : null), [dobString]);

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    if (!agePreview) return;
    setForm((prev) => ({ ...prev, age: agePreview.toString() }));
  }, [agePreview]);

  async function loadProfile() {
    try {
      const data = await apiFetch<{ profile?: any; photos?: any[]; user?: any }>("/profile");
      if (data.profile || data.user) {
        const incomingPreferences = data.profile?.preferences ?? {};
        setExistingPreferences(incomingPreferences);
        const resolvedIntent =
          typeof incomingPreferences.intent === "string"
            ? incomingPreferences.intent
            : preferenceDefaults.intent;
        const resolvedDistance =
          typeof incomingPreferences.distance === "string"
            ? incomingPreferences.distance
            : preferenceDefaults.distance;
        setPreferences({ intent: resolvedIntent, distance: resolvedDistance });
        if (!incomingPreferences.intent && !incomingPreferences.distance) {
          setHasPreferenceUpdates(true);
        }
        const incomingDob = typeof incomingPreferences.dob === "string" ? incomingPreferences.dob : "";
        setDob(parseDobString(incomingDob));
        setInterests(Array.isArray(incomingPreferences.interests) ? incomingPreferences.interests : []);
        setForm({
          displayName: data.user?.displayName ?? data.profile?.name ?? "",
          firstName: data.user?.firstName ?? "",
          lastName: data.user?.lastName ?? "",
          gender: data.profile.gender ?? "",
          genderPreference: data.profile.genderPreference ?? "ALL",
          age: data.profile.age?.toString() ?? "",
          city: data.profile.city ?? "",
          profession: data.profile.profession ?? "",
          bioShort: data.profile.bioShort ?? ""
        });
      }
      setPhotos(data.photos ?? []);
      const nextStep = getFirstIncompleteStep({
        form: {
          displayName: data.user?.displayName ?? data.profile?.name ?? "",
          gender: data.profile?.gender ?? "",
          genderPreference: data.profile?.genderPreference ?? "ALL",
          age: data.profile?.age?.toString() ?? "",
          city: data.profile?.city ?? "",
          profession: data.profile?.profession ?? "",
          bioShort: data.profile?.bioShort ?? ""
        },
        preferences: data.profile?.preferences ?? {},
        interests: Array.isArray(data.profile?.preferences?.interests)
          ? data.profile.preferences.interests
          : [],
        dob: typeof data.profile?.preferences?.dob === "string" ? data.profile.preferences.dob : "",
        photos: data.photos ?? []
      });
      setStepIndex(nextStep);
      setIsLoaded(true);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load profile.");
      setIsLoaded(true);
    }
  }

  function getFirstIncompleteStep({
    form: currentForm,
    preferences: preferenceData,
    interests: interestList,
    dob: dobValue,
    photos: photoList
  }: {
    form: {
      displayName: string;
      gender: string;
      genderPreference: string;
      age: string;
      city: string;
      profession: string;
      bioShort: string;
    };
    preferences: Record<string, any>;
    interests: string[];
    dob: string;
    photos: any[];
  }) {
    if (!currentForm.displayName || !currentForm.city || !currentForm.profession || !currentForm.bioShort) {
      return 0;
    }
    if (!dobValue || !currentForm.age) {
      return 1;
    }
    if (!currentForm.gender) {
      return 2;
    }
    if (!currentForm.genderPreference || !preferenceData.intent || !preferenceData.distance) {
      return 3;
    }
    if (!interestList.length) {
      return 4;
    }
    if (!photoList.length) {
      return 5;
    }
    return 6;
  }

  function updateField(key: keyof ProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePreference(key: "intent" | "distance", value: string) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasPreferenceUpdates(true);
  }

  function updateDobField(key: "year" | "month" | "day", value: string) {
    setDob((prev) => ({ ...prev, [key]: value }));
    setHasPreferenceUpdates(true);
  }

  function toggleInterest(value: string) {
    setInterests((prev) => {
      if (prev.includes(value)) {
        return prev.filter((interest) => interest !== value);
      }
      return [...prev, value];
    });
    setHasPreferenceUpdates(true);
  }

  function validatePhoto(file: File) {
    if (!allowedTypes.includes(file.type)) {
      setStatus("error");
      setMessage("Only JPEG, PNG, or WebP images are supported.");
      return false;
    }
    if (file.size > maxBytes) {
      setStatus("error");
      setMessage("Image must be 5MB or smaller.");
      return false;
    }
    return true;
  }

  async function handlePhotoUpload(file: File) {
    if (!validatePhoto(file)) return;
    setStatus("loading");
    setMessage("Uploading photo...");
    setUploadProgress(0);
    setIsUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        reader.onerror = () => reject(new Error("Unable to read file"));
        reader.readAsDataURL(file);
      });
      await apiFetch("/photos/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          dataUrl
        })
      });
      setStatus("success");
      setMessage("Photo uploaded.");
      await loadProfile();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to upload photo.");
    } finally {
      setIsUploading(false);
    }
  }

  function validateStep(step: StepId) {
    if (step === "name") {
      if (!form.displayName.trim() || !form.city.trim() || !form.profession.trim() || !form.bioShort.trim()) {
        setStatus("error");
        setMessage("Please add your name, location, profession, and a short bio.");
        return false;
      }
    }
    if (step === "dob") {
      if (!dobString || !agePreview) {
        setStatus("error");
        setMessage("Please choose your date of birth.");
        return false;
      }
      if (agePreview < 18) {
        setStatus("error");
        setMessage("You must be 18 or older to join.");
        return false;
      }
    }
    if (step === "gender" && !form.gender) {
      setStatus("error");
      setMessage("Please select your gender.");
      return false;
    }
    if (step === "preferences" && (!form.genderPreference || !preferences.intent || !preferences.distance)) {
      setStatus("error");
      setMessage("Please set who you want to see.");
      return false;
    }
    if (step === "interests" && !interests.length) {
      setStatus("error");
      setMessage("Pick at least one interest.");
      return false;
    }
    if (step === "photos" && !photos.length) {
      setStatus("error");
      setMessage("Add at least one photo to continue.");
      return false;
    }
    return true;
  }

  async function saveProfile() {
    const displayName = form.displayName.trim();
    const ageNumber = Number(form.age);
    const city = form.city.trim();
    const profession = form.profession.trim();
    const bioShort = form.bioShort.trim();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();

    if (!displayName || !form.gender || !form.age || !city || !profession || !bioShort) {
      setStatus("error");
      setMessage("Please complete every required field.");
      return false;
    }
    if (!Number.isFinite(ageNumber) || ageNumber < 18) {
      setStatus("error");
      setMessage("Please enter an age of 18 or older.");
      return false;
    }
    setStatus("loading");
    setMessage("Saving profile…");
    try {
      const intent = preferences.intent || existingPreferences.intent || preferenceDefaults.intent;
      const distance =
        preferences.distance || existingPreferences.distance || preferenceDefaults.distance;
      const nextPreferences = hasPreferenceUpdates
        ? {
            ...existingPreferences,
            intent,
            distance,
            interests,
            dob: dobString || existingPreferences.dob
          }
        : Object.keys(existingPreferences).length
          ? existingPreferences
          : { intent, distance, interests, dob: dobString };
      const response = await apiFetch<{ requiresPhoto?: boolean }>("/profile", {
        method: "PUT",
        body: JSON.stringify({
          displayName,
          firstName: firstName || null,
          lastName: lastName || null,
          gender: form.gender,
          genderPreference: form.genderPreference,
          age: ageNumber,
          city,
          profession,
          bioShort,
          preferences: nextPreferences
        })
      });
      if (response.requiresPhoto) {
        setStatus("error");
        setMessage("Add at least one photo to activate your profile.");
        return false;
      }
      setStatus("success");
      setMessage("Profile completed. Redirecting you to discover...");
      await refresh();
      return true;
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
      return false;
    }
  }

  async function handleNext() {
    const step = steps[stepIndex].id;
    setMessage("");
    if (!validateStep(step)) return;
    if (step === "photos") {
      const saved = await saveProfile();
      if (saved) {
        setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      }
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function handleBack() {
    setMessage("");
    setStatus("idle");
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }

  function renderStep() {
    const step = steps[stepIndex].id;
    if (step === "name") {
      return (
        <div className="wizard-step">
          <div className="field">
            <label htmlFor="profile-display-name">Display name</label>
            <input
              id="profile-display-name"
              placeholder="Your display name"
              value={form.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
            />
          </div>
          <div className="grid two-column">
            <div className="field">
              <label htmlFor="profile-first-name">First name</label>
              <input
                id="profile-first-name"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="profile-last-name">Last name</label>
              <input
                id="profile-last-name"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
              />
            </div>
          </div>
          <div className="grid two-column">
            <div className="field">
              <label htmlFor="profile-city">City</label>
              <input
                id="profile-city"
                placeholder="City"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="profile-profession">Profession</label>
              <input
                id="profile-profession"
                placeholder="Profession"
                value={form.profession}
                onChange={(e) => updateField("profession", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="profile-bio">Short bio</label>
            <textarea
              id="profile-bio"
              placeholder="A quick line about your vibe."
              value={form.bioShort}
              onChange={(e) => updateField("bioShort", e.target.value)}
            />
          </div>
        </div>
      );
    }
    if (step === "dob") {
      return (
        <div className="wizard-step">
          <div className="dob-picker">
            <div className="field">
              <label htmlFor="dob-month">Month</label>
              <select
                id="dob-month"
                value={dob.month}
                onChange={(e) => updateDobField("month", e.target.value)}
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }).map((_, index) => (
                  <option key={index + 1} value={`${index + 1}`}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dob-day">Day</label>
              <select
                id="dob-day"
                value={dob.day}
                onChange={(e) => updateDobField("day", e.target.value)}
              >
                <option value="">DD</option>
                {Array.from({ length: 31 }).map((_, index) => (
                  <option key={index + 1} value={`${index + 1}`}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dob-year">Year</label>
              <select
                id="dob-year"
                value={dob.year}
                onChange={(e) => updateDobField("year", e.target.value)}
              >
                <option value="">YYYY</option>
                {Array.from({ length: 60 }).map((_, index) => {
                  const year = new Date().getFullYear() - 18 - index;
                  return (
                    <option key={year} value={`${year}`}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="dob-preview">
            {agePreview ? (
              <p className="card-subtitle">You’ll appear as {agePreview} years old.</p>
            ) : (
              <p className="card-subtitle">Select your DOB to preview your age.</p>
            )}
          </div>
        </div>
      );
    }
    if (step === "gender") {
      return (
        <div className="wizard-step">
          <div className="field">
            <label htmlFor="profile-gender">Gender</label>
            <select
              id="profile-gender"
              value={form.gender}
              onChange={(e) => updateField("gender", e.target.value)}
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      );
    }
    if (step === "preferences") {
      return (
        <div className="wizard-step">
          <div className="field">
            <label>Interested in</label>
            <div className="chip-grid">
              {["ALL", "MALE", "FEMALE", "NON_BINARY", "OTHER"].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={form.genderPreference === value ? "chip active" : "chip"}
                  onClick={() => updateField("genderPreference", value)}
                >
                  {value === "ALL" ? "Everyone" : value.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Intent</label>
            <div className="segmented-control">
              <button
                type="button"
                className={preferences.intent === "serious" ? "active" : ""}
                onClick={() => updatePreference("intent", "serious")}
              >
                Serious
              </button>
              <button
                type="button"
                className={preferences.intent === "casual" ? "active" : ""}
                onClick={() => updatePreference("intent", "casual")}
              >
                Casual
              </button>
            </div>
          </div>
          <div className="field">
            <label>Distance</label>
            <div className="segmented-control">
              <button
                type="button"
                className={preferences.distance === "local" ? "active" : ""}
                onClick={() => updatePreference("distance", "local")}
              >
                Local
              </button>
              <button
                type="button"
                className={preferences.distance === "anywhere" ? "active" : ""}
                onClick={() => updatePreference("distance", "anywhere")}
              >
                Anywhere
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (step === "interests") {
      return (
        <div className="wizard-step">
          <p className="card-subtitle">Choose up to five interests.</p>
          <div className="chip-grid">
            {INTEREST_OPTIONS.map((interest) => {
              const isActive = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  className={isActive ? "chip active" : "chip"}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    if (step === "photos") {
      return (
        <div className="wizard-step">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handlePhotoUpload(file);
              }
            }}
          />
          <div className="inline-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {photos.length ? "Replace photo" : "Upload photo"}
            </button>
            {isUploading ? <span className="card-subtitle">Uploading… {uploadProgress}%</span> : null}
          </div>
          {photos.length ? (
            <div className="photo-grid single">
              <img key={photos[0].id} src={getAssetUrl(photos[0].url) ?? ""} alt="Profile" />
            </div>
          ) : (
            <p className="card-subtitle">No photos uploaded yet.</p>
          )}
        </div>
      );
    }
    return (
      <div className="wizard-step wizard-done">
        <div className="avatar-placeholder">✨</div>
        <h3>Profile ready</h3>
        <p className="card-subtitle">You’re all set to start discovering premium introductions.</p>
        <button onClick={() => router.push("/app/discover")} type="button">
          Go to Discover
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="card">
        <h2>Setting up your profile...</h2>
        <p className="card-subtitle">Loading your saved details.</p>
      </div>
    );
  }

  return (
    <div className="wizard-layout">
      <section className="card wizard-card">
        <div className="wizard-header">
          <div>
            <h2>Profile setup</h2>
            <p className="card-subtitle">A guided setup for your best first impression.</p>
          </div>
          <div className="wizard-progress">
            <span>
              Step {Math.min(stepIndex + 1, steps.length)} of {steps.length}
            </span>
          </div>
        </div>
        <div className="wizard-step-header">
          <h3>{steps[stepIndex].label}</h3>
          <p className="card-subtitle">{steps[stepIndex].description}</p>
        </div>
        {renderStep()}
        {message ? <p className={`message ${status}`}>{message}</p> : null}
        <div className="wizard-actions">
          <button type="button" className="secondary" onClick={handleBack} disabled={stepIndex === 0}>
            Back
          </button>
          {steps[stepIndex].id === "done" ? null : (
            <button type="button" onClick={handleNext} disabled={status === "loading"}>
              {steps[stepIndex].id === "photos" ? "Finish" : "Next"}
            </button>
          )}
        </div>
      </section>
      <section className="card wizard-progress-card">
        <h3>Progress</h3>
        <ul className="progress">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={
                index === stepIndex
                  ? "active"
                  : index < stepIndex
                    ? "done"
                    : ""
              }
            >
              <span>{index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
