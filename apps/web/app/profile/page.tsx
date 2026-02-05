"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { getAssetUrl } from "../../lib/assets";
import RouteGuard from "../components/RouteGuard";
import { useSession } from "../../lib/session";

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
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { setToken } = useSession();
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxBytes = 5 * 1024 * 1024;
  const preferenceDefaults = { intent: "serious", distance: "local" };
  const intentLabel: Record<string, string> = {
    serious: "Serious",
    casual: "Casual"
  };
  const distanceLabel: Record<string, string> = {
    local: "Local",
    anywhere: "Anywhere"
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load profile.");
      setStatus("error");
    }
  }

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePreference(key: "intent" | "distance", value: string) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
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
        ? { ...existingPreferences, intent, distance }
        : Object.keys(existingPreferences).length
          ? existingPreferences
          : { intent, distance };
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
      <div className="profile-page">
        <section className="card profile-hero">
          <div className="profile-hero-media">
            {photos.length ? (
              <img
                key={photos[0].id}
                src={getAssetUrl(photos[0].url) ?? ""}
                alt="Profile"
                className="profile-photo-large"
              />
            ) : (
              <div className="profile-photo-placeholder">Add a photo</div>
            )}
          </div>
          <div className="profile-hero-content">
            <h2>
              {form.displayName || "Your profile"}
              {form.age ? <span className="profile-age"> {form.age}</span> : null}
            </h2>
            <p className="card-subtitle">
              {form.city || "City"} {form.profession ? `• ${form.profession}` : ""}
            </p>
            <p className="profile-bio-preview">
              {form.bioShort || "Share a short bio to help people get to know you."}
            </p>
            <div className="preference-list">
              <span className="preference-chip">
                Intent: {intentLabel[preferences.intent] ?? "Serious"}
              </span>
              <span className="preference-chip">
                Distance: {distanceLabel[preferences.distance] ?? "Local"}
              </span>
            </div>
          </div>
        </section>

        <div className="profile-grid">
          <section className="card profile-form-card">
            <div>
              <h2>Edit profile</h2>
              <p className="card-subtitle">Make it feel like you.</p>
            </div>
            <div className="form">
              <div className="form-section">
                <div className="section-header">
                  <h3>Basic info</h3>
                  <p className="card-subtitle">Your essentials for matching.</p>
                </div>
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
                <div className="grid two-column">
                  <div className="field">
                    <label htmlFor="profile-age">Age</label>
                    <input
                      id="profile-age"
                      type="number"
                      min="18"
                      inputMode="numeric"
                      placeholder="Age"
                      value={form.age}
                      onChange={(e) => updateField("age", e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="profile-city">City</label>
                    <input
                      id="profile-city"
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                    />
                  </div>
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

              <div className="form-section">
                <div className="section-header">
                  <h3>About you</h3>
                  <p className="card-subtitle">A short intro goes a long way.</p>
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
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Preferences</h3>
                  <p className="card-subtitle">Set the vibe and distance.</p>
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

              {message ? <p className={`message ${status}`}>{message}</p> : null}
              <div className="sticky-actions">
                <button onClick={saveProfile} disabled={status === "loading"}>
                  {status === "loading" ? "Saving..." : "Save Profile"}
                </button>
                <button className="secondary" onClick={logout} disabled={status === "loading"}>
                  Logout
                </button>
              </div>
            </div>
          </section>

          <section className="card muted profile-photo-card">
            <div className="section-header">
              <h3>Profile photo</h3>
              <p className="card-subtitle">Add one strong photo for your first impression.</p>
            </div>
            <div className="inline-actions">
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
              <button
                type="button"
                className="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {photos.length ? "Edit photo" : "Upload photo"}
              </button>
              {isUploading ? <span className="card-subtitle">Uploading… {uploadProgress}%</span> : null}
            </div>
            {photos.length ? (
              <div className="photo-grid single">
                <img
                  key={photos[0].id}
                  src={getAssetUrl(photos[0].url) ?? ""}
                  alt="Profile"
                />
              </div>
            ) : (
              <p className="card-subtitle">No photo uploaded yet.</p>
            )}
          </section>
        </div>
      </div>
    </RouteGuard>
  );
}
