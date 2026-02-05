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
    bioShort: "",
    preferences: "{}"
  });
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { setToken } = useSession();
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxBytes = 5 * 1024 * 1024;

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await apiFetch<{ profile?: any; photos?: any[]; user?: any }>("/profile");
      if (data?.profile || data?.user) {
        setForm({
          displayName: data.user?.displayName ?? data.profile?.name ?? "",
          firstName: data.user?.firstName ?? "",
          lastName: data.user?.lastName ?? "",
          gender: data.profile.gender ?? "",
          genderPreference: data.profile.genderPreference ?? "ALL",
          age: data.profile.age?.toString() ?? "",
          city: data.profile.city ?? "",
          profession: data.profile.profession ?? "",
          bioShort: data.profile.bioShort ?? "",
          preferences: JSON.stringify(data.profile.preferences ?? {})
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
    setStatus("loading");
    setMessage("Saving your profile...");
    try {
      const preferences = form.preferences ? JSON.parse(form.preferences) : {};
      await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          preferences
        })
      });
      setStatus("success");
      setMessage("Profile saved.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    }
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setToken(null);
    router.push("/");
  }

  return (
    <RouteGuard requireActive>
      <div className="card">
        <div>
          <h2>Your profile</h2>
          <p className="card-subtitle">Edit your details or sign out.</p>
        </div>
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
          <div className="field">
            <label htmlFor="profile-age">Age</label>
            <input
              id="profile-age"
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
            <label htmlFor="profile-preferences">Preferences (JSON)</label>
            <textarea
              id="profile-preferences"
              placeholder='{"intent":"serious","distance":"local"}'
              value={form.preferences}
              onChange={(e) => updateField("preferences", e.target.value)}
            />
          </div>
          <div className="inline-actions">
            <button onClick={saveProfile} disabled={status === "loading"}>
              {status === "loading" ? "Saving..." : "Save Profile"}
            </button>
            <button className="secondary" onClick={logout} disabled={status === "loading"}>
              Logout
            </button>
          </div>
          {message ? <p className={`message ${status}`}>{message}</p> : null}
          <div className="card muted">
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
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
