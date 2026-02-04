"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { getAssetUrl } from "../../../lib/assets";
import { useSession } from "../../../lib/session";

type Status = "idle" | "loading" | "success" | "error";

type ProfileForm = {
  name: string;
  gender: string;
  genderPreference: string;
  age: string;
  city: string;
  profession: string;
  bioShort: string;
};

export default function OnboardingProfilePage() {
  const { refresh } = useSession();
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    gender: "",
    genderPreference: "ALL",
    age: "",
    city: "",
    profession: "",
    bioShort: ""
  });
  const [photos, setPhotos] = useState<any[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await apiFetch<{ profile?: any; photos?: any[] }>("/profile");
      if (data.profile) {
        setForm({
          name: data.profile.name ?? "",
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
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load profile.");
    }
  }

  function updateField(key: keyof ProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePhotoUpload(file: File) {
    setStatus("loading");
    setMessage("Uploading photo...");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
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
    }
  }

  async function saveProfile() {
    if (!form.name || !form.gender || !form.age || !form.city || !form.profession || !form.bioShort) {
      setStatus("error");
      setMessage("Please complete every profile field.");
      return;
    }
    setStatus("loading");
    setMessage("Saving profile...");
    try {
      const response = await apiFetch<{ requiresPhoto?: boolean }>("/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          preferences: {}
        })
      });
      if (response.requiresPhoto) {
        setStatus("error");
        setMessage("Add at least one photo to activate your profile.");
      } else {
        setStatus("success");
        setMessage("Profile completed. Redirecting you to the app...");
      }
      await refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    }
  }

  return (
    <div className="grid two-column">
      <section className="card">
        <h2>Profile setup</h2>
        <p className="card-subtitle">Complete your profile and upload at least one photo.</p>
        <div className="form">
          <div className="field">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
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
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="profile-age">Age</label>
            <input
              id="profile-age"
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="profile-city">Location</label>
            <input
              id="profile-city"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="profile-profession">Profession</label>
            <input
              id="profile-profession"
              value={form.profession}
              onChange={(e) => updateField("profession", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              value={form.bioShort}
              onChange={(e) => updateField("bioShort", e.target.value)}
            />
          </div>
          <button onClick={saveProfile} disabled={status === "loading"}>
            {status === "loading" ? "Saving..." : "Save profile"}
          </button>
          {message ? <p className={`message ${status}`}>{message}</p> : null}
        </div>
      </section>

      <section className="card">
        <h3>Profile photos</h3>
        <p className="card-subtitle">Upload at least one photo to activate.</p>
        <div className="form">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handlePhotoUpload(file);
              }
            }}
          />
        </div>
        {photos.length ? (
          <div className="photo-grid">
            {photos.map((photo) => (
              <img
                key={photo.id}
                src={getAssetUrl(photo.url) ?? ""}
                alt="Profile"
              />
            ))}
          </div>
        ) : (
          <p className="card-subtitle">No photos uploaded yet.</p>
        )}
      </section>
    </div>
  );
}
