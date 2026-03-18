"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Loader2, PencilLine, Trash2 } from "lucide-react";
import { ApiError, apiRequestAuth } from "@/lib/api";
import { fetchProfile, type ProfileViewModel } from "@/lib/queries";
import { useStaleWhileRevalidate } from "@/lib/cache";
import { useAuth } from "@/contexts/AuthContext";

const MAX_PHOTOS = 3;
const MIN_PHOTOS = 1;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read selected file."));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const profileQuery = useStaleWhileRevalidate({ key: "profile", fetcher: fetchProfile, enabled: isAuthenticated && onboardingStep === "COMPLETED" });
  const [message, setMessage] = useState("");

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;
  if (profileQuery.isLoading && !profileQuery.data) return <div className="p-6 text-sm">Loading profile…</div>;
  if (!profileQuery.data) return <div className="p-6 text-sm">Unable to load profile.</div>;

  const profile = profileQuery.data;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-xl uppercase tracking-[0.25em] text-primary">Profile</h1>
      </header>

      <PhotoManager
        photos={profile.photos}
        onUpdated={async (text) => {
          setMessage(text);
          await profileQuery.refresh(true);
        }}
      />

      <EditProfileSection
        profile={profile}
        onSaved={async () => {
          setMessage("Profile updated.");
          await profileQuery.refresh(true);
        }}
      />

      <section className="rounded-2xl border border-primary/20 p-4 space-y-2">
        <h2 className="text-sm uppercase tracking-[0.18em] text-primary">Managed by</h2>
        <p className="text-sm">Managed by {profile.assignedExecutive?.name ?? "VAEL Executive"}, your personal VAEL executive.</p>
      </section>

      <section className="rounded-2xl border border-primary/20 p-4 space-y-2">
        <h2 className="text-sm uppercase tracking-[0.18em] text-primary">Membership card</h2>
        <p className="text-sm">Plan: {profile.subscription.paymentPlan ?? profile.subscription.tier}</p>
        <p className="text-sm">Start: {formatDate(profile.subscription.startedAt)}</p>
        <p className="text-sm">End: {formatDate(profile.subscription.endsAt)}</p>
        <p className="text-sm">Days remaining: {daysRemaining(profile.subscription.endsAt)}</p>
      </section>

      {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
    </div>
  );
}

function EditProfileSection({ profile, onSaved }: { profile: ProfileViewModel; onSaved: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [profession, setProfession] = useState(profile.profession ?? "");
  const [city, setCity] = useState(profile.place ?? profile.location ?? "");
  const [height, setHeight] = useState(profile.heightCm ? String(profile.heightCm) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const validation = useMemo(() => {
    const parsedHeight = Number(height);
    if (!city.trim()) return "City is required.";
    if (!Number.isFinite(parsedHeight) || parsedHeight < 100 || parsedHeight > 250) return "Height must be between 100 and 250.";
    if (bio.length > 300) return "Bio max length is 300.";
    return "";
  }, [bio, city, height]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (validation) return;
    setSaving(true);
    setError("");
    try {
      const result = await apiRequestAuth<{ updated: boolean }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ bio: bio.trim(), profession: profession.trim(), city: city.trim(), height: Number(height) })
      });
      if (!result.updated) throw new Error("Profile update did not complete.");
      setEditing(false);
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <section className="rounded-2xl border border-border/40 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-[0.18em]">Profile details</h2>
          <button onClick={() => setEditing(true)} className="text-xs inline-flex items-center gap-1"><PencilLine size={12} /> Edit</button>
        </div>
        <p className="text-sm">Name: {profile.name}</p>
        <p className="text-sm">Age: {profile.age ?? "—"}</p>
        <p className="text-sm">City: {profile.place || profile.location || "—"}</p>
        <p className="text-sm">Profession: {profile.profession || "—"}</p>
        <p className="text-sm">Bio: {profile.bio || "—"}</p>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-primary/20 p-4 space-y-3">
      <input value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Profession" className="w-full rounded border p-2 bg-transparent" />
      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full rounded border p-2 bg-transparent" />
      <input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Height (cm)" className="w-full rounded border p-2 bg-transparent" />
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" className="w-full rounded border p-2 bg-transparent" rows={4} />
      {validation ? <p className="text-xs text-amber-300">{validation}</p> : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      <button disabled={saving || Boolean(validation)} className="btn-vael-primary disabled:opacity-40">{saving ? "Saving..." : "Save"}</button>
    </form>
  );
}

function PhotoManager({ photos, onUpdated }: { photos: ProfileViewModel["photos"]; onUpdated: (message: string) => Promise<void> }) {
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || photos.length >= MAX_PHOTOS) return;
    setUploading(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const token = await apiRequestAuth<{ uploadToken: string }>("/me/profile/photos/presigned-url", {
        method: "POST",
        body: JSON.stringify({ filename: file.name, mimeType: file.type || "image/jpeg" })
      });
      await apiRequestAuth("/me/profile/photos/confirm", {
        method: "POST",
        body: JSON.stringify({ uploadToken: token.uploadToken, filename: file.name, dataUrl, cropX: 0, cropY: 0, cropZoom: 1 })
      });
      await onUpdated("Photo uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (photoId: string) => {
    if (photos.length <= MIN_PHOTOS) return;
    setBusy(photoId);
    setError("");
    try {
      await apiRequestAuth(`/api/profile/photos/${photoId}`, { method: "DELETE" });
      await onUpdated("Photo deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  };

  const reorder = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    try {
      await apiRequestAuth("/api/profile/photos/reorder", {
        method: "PATCH",
        body: JSON.stringify({ photoIds: next.map((photo) => photo.id) })
      });
      await onUpdated("Photo order saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed.");
    }
  };

  return (
    <section className="rounded-2xl border border-border/40 p-4 space-y-3">
      <h2 className="text-sm uppercase tracking-[0.18em]">Profile photo</h2>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative aspect-[3/4] rounded overflow-hidden border">
            <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 flex gap-1">
              <button type="button" disabled={index === 0} onClick={() => void reorder(index, -1)} className="bg-black/50 text-white px-1">←</button>
              <button type="button" disabled={index === photos.length - 1} onClick={() => void reorder(index, 1)} className="bg-black/50 text-white px-1">→</button>
              <button type="button" disabled={busy === photo.id || photos.length <= MIN_PHOTOS} onClick={() => void remove(photo.id)} className="bg-black/50 text-white p-1">{busy === photo.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}</button>
            </div>
          </div>
        ))}
      </div>
      <label className="inline-flex border rounded px-3 py-2 text-xs cursor-pointer">
        <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => void upload(e)} disabled={uploading || photos.length >= MAX_PHOTOS} />
        {uploading ? "Uploading..." : photos.length >= MAX_PHOTOS ? "Max reached" : "Tap to change / add photo"}
      </label>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function daysRemaining(value?: string | null) {
  if (!value) return "—";
  const n = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return String(Math.max(0, n));
}
