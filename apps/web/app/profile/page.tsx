"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { getAssetUrl } from "../../lib/assets";
import RouteGuard from "../components/RouteGuard";
import AppShellLayout from "../components/ui/AppShellLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import Tabs from "../components/ui/Tabs";
import { useSession } from "../../lib/session";
import { buildDobString, getAgeFromDob, INTEREST_OPTIONS, parseDobString } from "../../lib/profileUtils";

type Status = "idle" | "loading" | "success" | "error";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
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
  const [status, setStatus] = useState<Status>("idle");
  const [loadStatus, setLoadStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [dob, setDob] = useState({ year: "", month: "", day: "" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<"about" | "photos">("about");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { setToken } = useSession();
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxBytes = 5 * 1024 * 1024;
  const preferenceDefaults = { intent: "serious", distance: "local" };
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
    setLoadStatus("loading");
    try {
      const data = await apiFetch<{ profile?: any; photos?: any[]; user?: any }>("/profile");
      if (data?.profile || data?.user) {
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
      setLoadStatus("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load profile.");
      setLoadStatus("error");
    }
  }

  function updateField(key: string, value: string) {
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
      setMessage("Please complete all required fields before saving.");
      return;
    }
    if (!Number.isFinite(ageNumber) || ageNumber < 18) {
      setStatus("error");
      setMessage("Please enter an age of 18 or older.");
      return;
    }
    setStatus("loading");
    setMessage("Saving your profile...");
    try {
      const intent =
        preferences.intent || existingPreferences.intent || preferenceDefaults.intent;
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
      await apiFetch("/profile", {
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
      setStatus("success");
      setMessage("Your profile is updated and ready to go.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save your profile right now.");
    }
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setToken(null);
    router.push("/");
  }

  return (
    <RouteGuard requireActive>
      <AppShellLayout>
        <div className="profile-sections">
          <PageHeader title="Profile" subtitle="Curate your presence on ELITE MATCH." />
          {loadStatus === "loading" ? (
            <LoadingState message="Loading your profile..." />
          ) : loadStatus === "error" ? (
            <ErrorState message={message || "Unable to load profile."} onRetry={loadProfile} />
          ) : (
            <>
              <Card>
                <div className="profile-header">
                  <div className="avatar-circle">
                    {photos.length ? (
                      <img src={getAssetUrl(photos[0].url) ?? ""} alt="Profile avatar" />
                    ) : (
                      <span>{form.displayName?.slice(0, 1) || "E"}</span>
                    )}
                  </div>
                  <div>
                    <h2>{form.displayName || "Your profile"}</h2>
                    <p className="text-muted">{form.bioShort || "Add a short bio to introduce yourself."}</p>
                    <div className="profile-stats">
                      <div className="stat-item">
                        <strong>Likes</strong>
                        <span className="text-muted">—</span>
                      </div>
                      <div className="stat-item">
                        <strong>Matches</strong>
                        <span className="text-muted">—</span>
                      </div>
                      <div className="stat-item">
                        <strong>Verified</strong>
                        <span className="text-muted">{form.gender ? "Yes" : "Pending"}</span>
                      </div>
                    </div>
                    <div className="page-header__actions">
                      <Button variant="secondary" onClick={saveProfile} disabled={status === "loading"}>
                        Edit profile
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        Upload photo
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Tabs
                tabs={[
                  { id: "about", label: "About" },
                  { id: "photos", label: "Photos" }
                ]}
                active={activeSection}
                onChange={(value) => setActiveSection(value as "about" | "photos")}
              />

              {activeSection === "about" ? (
                <Card>
                  <h3>About</h3>
                  <div className="form">
                    <div className="field">
                      <label htmlFor="profile-display-name">Display name</label>
                      <input
                        id="profile-display-name"
                        placeholder="Your display name"
                        value={form.displayName}
                        onChange={(e) => updateField("displayName", e.target.value)}
                      />
                    </div>
                    <div className="dob-picker">
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
                      <div className="field">
                        <label htmlFor="profile-age">Age</label>
                        <input
                          id="profile-age"
                          type="number"
                          min="18"
                          inputMode="numeric"
                          placeholder="Age"
                          value={form.age}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="dob-picker">
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
                      <div className="field">
                        <label htmlFor="profile-gender-preference">Interested in</label>
                        <select
                          id="profile-gender-preference"
                          value={form.genderPreference}
                          onChange={(e) => updateField("genderPreference", e.target.value)}
                        >
                          <option value="ALL">All</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="NON_BINARY">Non-binary</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="dob-picker">
                      <div className="field">
                        <label htmlFor="edit-dob-month">Month</label>
                        <select
                          id="edit-dob-month"
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
                        <label htmlFor="edit-dob-day">Day</label>
                        <select
                          id="edit-dob-day"
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
                        <label htmlFor="edit-dob-year">Year</label>
                        <select
                          id="edit-dob-year"
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
                    <p className="text-muted">
                      {agePreview ? `You’ll appear as ${agePreview} years old.` : "Select your DOB to preview your age."}
                    </p>
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
                    <div className="field">
                      <label htmlFor="profile-bio">Short bio</label>
                      <textarea
                        id="profile-bio"
                        placeholder="One or two sentences that highlight you."
                        value={form.bioShort}
                        onChange={(e) => updateField("bioShort", e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Intent</label>
                      <div className="tabs">
                        <button
                          type="button"
                          className={preferences.intent === "serious" ? "tab active" : "tab"}
                          onClick={() => updatePreference("intent", "serious")}
                        >
                          Serious
                        </button>
                        <button
                          type="button"
                          className={preferences.intent === "casual" ? "tab active" : "tab"}
                          onClick={() => updatePreference("intent", "casual")}
                        >
                          Casual
                        </button>
                      </div>
                    </div>
                    <div className="field">
                      <label>Distance</label>
                      <div className="tabs">
                        <button
                          type="button"
                          className={preferences.distance === "local" ? "tab active" : "tab"}
                          onClick={() => updatePreference("distance", "local")}
                        >
                          Local
                        </button>
                        <button
                          type="button"
                          className={preferences.distance === "anywhere" ? "tab active" : "tab"}
                          onClick={() => updatePreference("distance", "anywhere")}
                        >
                          Anywhere
                        </button>
                      </div>
                    </div>
                    <div className="field">
                      <label>Interests</label>
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
                    {message ? <p className={`message ${status}`}>{message}</p> : null}
                    <div className="page-header__actions">
                      <Button onClick={saveProfile} disabled={status === "loading"}>
                        {status === "loading" ? "Saving..." : "Save Profile"}
                      </Button>
                      <Button variant="secondary" onClick={logout} disabled={status === "loading"}>
                        Logout
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <h3>Photos</h3>
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
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {photos.length ? "Edit photo" : "Upload photo"}
                  </Button>
                  {isUploading ? <span className="text-muted">Uploading… {uploadProgress}%</span> : null}
                  {photos.length ? (
                    <img src={getAssetUrl(photos[0].url) ?? ""} alt="Profile" />
                  ) : (
                    <p className="text-muted">No photo uploaded yet.</p>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      </AppShellLayout>
    </RouteGuard>
  );
}
