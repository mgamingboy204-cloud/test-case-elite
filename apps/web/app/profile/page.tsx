"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { getAssetUrl } from "../../lib/assets";
import RouteGuard from "../components/RouteGuard";
import { useSession } from "../../lib/session";

type Status = "idle" | "loading" | "success" | "error";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
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
  const { setToken } = useSession();

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await apiFetch<any>("/profile");
      if (data?.profile) {
        setForm({
          name: data.profile.name ?? "",
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
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              placeholder="Your full name"
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
          ) : null}
        </div>
      </div>
    </RouteGuard>
  );
}
