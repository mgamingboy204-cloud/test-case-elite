"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiRequest } from "@/lib/api";
import { fetchProfile, type ProfileViewModel } from "@/lib/queries";
import { useStaleWhileRevalidate } from "@/lib/cache";
import { Loader2, PencilLine, ShieldCheck, UserRoundCheck, ImagePlus, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";

const MAX_PHOTOS = 3;
const MIN_PHOTOS = 1;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 240;

type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "OTHER";

type SettingsField = "pushNotificationsEnabled" | "profileVisible" | "showOnlineStatus" | "discoverableByPremiumOnly";

function calculateAgeFromDate(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatPaymentPlan(plan?: string | null) {
  if (!plan) return "Premium";
  if (plan === "ONE_MONTH") return "1 Month";
  if (plan === "FIVE_MONTHS") return "5 Months";
  if (plan === "TWELVE_MONTHS") return "12 Months";
  return plan;
}

function formatMoneyInr(amount?: number | null) {
  if (!amount || amount <= 0) return "Tax included";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { isAuthenticated, onboardingStep, logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [savingField, setSavingField] = useState<SettingsField | null>(null);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  const profileQuery = useStaleWhileRevalidate({
    key: "profile",
    fetcher: fetchProfile,
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    staleTimeMs: 60_000
  });

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  if (profileQuery.isLoading && !profileQuery.data) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.error && !profileQuery.data) {
    return (
      <div className="px-6 py-10 space-y-4">
        <h1 className="text-xl uppercase tracking-[0.35em] text-primary">Profile</h1>
        <div className="rounded-3xl border border-red-300/20 bg-red-400/5 p-5">
          <p className="text-sm text-red-200">We couldn’t load your profile right now.</p>
          <button
            onClick={() => void profileQuery.refresh(true)}
            className="mt-4 rounded-xl border border-primary/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return (
      <div className="px-6 py-10">
        <h1 className="text-xl uppercase tracking-[0.35em] text-primary">Profile</h1>
        <p className="mt-4 text-sm text-foreground/60">Your profile is currently unavailable. Please refresh.</p>
      </div>
    );
  }

  const settings = profile.settings ?? {
    pushNotificationsEnabled: true,
    profileVisible: true,
    showOnlineStatus: true,
    discoverableByPremiumOnly: false
  };

  const toggleSetting = async (key: SettingsField, value: boolean) => {
    setSavingField(key);
    setSettingsError("");
    setSettingsMessage("");

    try {
      await apiRequest("/profile/settings", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ [key]: value })
      });
      setSettingsMessage("Settings saved.");
      await profileQuery.refresh(true);
    } catch (error) {
      setSettingsError(error instanceof ApiError ? error.message : "Unable to save this setting right now.");
    } finally {
      setSavingField(null);
    }
  };

  const onLogout = async () => {
    setLogoutPending(true);
    try {
      await logout();
    } finally {
      setLogoutPending(false);
    }
  };

  const canDelete = deleteConfirm.trim().toUpperCase() === "DELETE";

  const onDeleteAccount = async () => {
    if (!canDelete) {
      setSettingsError("Type DELETE to confirm account deletion.");
      return;
    }

    setDeleting(true);
    setSettingsError("");
    setSettingsMessage("");

    try {
      await apiRequest<{ ok: true }>("/account", {
        method: "DELETE",
        auth: true,
        body: JSON.stringify({
          confirmation: "DELETE_MY_ACCOUNT",
          reason: deleteReason.trim() || undefined
        })
      });

      localStorage.removeItem("vael_pending_phone");
      localStorage.removeItem("vael_signup_token");
      await logout();
    } catch (error) {
      setSettingsError(error instanceof ApiError ? error.message : "We could not process account deletion right now.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-6 py-8 space-y-6 pb-24">
      <header className="space-y-2">
        <h1 className="text-xl uppercase tracking-[0.35em] text-primary">Profile</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-foreground/45">Private membership identity</p>
      </header>

      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-serif text-foreground">{profile.name || "Private Member"}</p>
            <p className="mt-1 text-sm text-foreground/60">
              {profile.age ? `${profile.age} years` : "Age private"} • {profile.place || profile.location || "Location private"}
            </p>
          </div>
          <button
            onClick={() => {
              setEditing((value) => !value);
              setSaveMessage("");
            }}
            className="rounded-xl border border-primary/30 px-3 py-2 text-xs uppercase tracking-[0.2em] text-primary"
          >
            <span className="inline-flex items-center gap-2"><PencilLine size={14} />{editing ? "Close" : "Edit"}</span>
          </button>
        </div>

        {profile.assignedExecutive ? (
          <div className="mt-4 rounded-2xl border border-primary/25 bg-background/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Human-managed service</p>
            <p className="mt-2 text-sm text-foreground/85 inline-flex items-center gap-2">
              <UserRoundCheck size={16} className="text-primary" />
              Your profile is being managed by our executive <span className="font-medium">{profile.assignedExecutive.name}</span>
            </p>
          </div>
        ) : null}
      </section>

      <PhotoManager
        profile={profile}
        onUpdated={async (message) => {
          setPhotoMessage(message);
          await profileQuery.refresh(true);
        }}
      />

      {photoMessage ? <p className="text-xs text-emerald-300">{photoMessage}</p> : null}

      {editing ? (
        <ProfileEditForm
          profile={profile}
          onCancel={() => setEditing(false)}
          onSaved={async (message) => {
            setSaveMessage(message);
            setEditing(false);
            await profileQuery.refresh(true);
          }}
        />
      ) : (
        <ProfileReadView profile={profile} />
      )}

      {saveMessage ? <p className="text-xs text-emerald-300">{saveMessage}</p> : null}

      <MembershipSummary profile={profile} />

      {/* Settings merged from former Settings page */}
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-primary">Subscription</h2>
        <Field
          label="Plan"
          value={`${formatPaymentPlan(profile.subscription.paymentPlan)} • ${formatMoneyInr(profile.subscription.paymentAmount)}`}
        />
        <Field label="Status" value={profile.subscription.status} />
        <Field label="Start date" value={formatDate(profile.subscription.startedAt ?? profile.subscription.paidAt ?? null)} />
        <Field label="Valid until" value={formatDate(profile.subscription.endsAt ?? null)} />
        <p className="text-xs text-foreground/55">Manual renewal only. Membership never auto-renews.</p>
      </section>

      <section className="rounded-3xl border border-border/40 bg-foreground/[0.03] p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Notifications</h2>
        <ToggleRow
          label="App alerts"
          description="Receive updates for likes, matches, concierge coordination, and account events."
          checked={settings.pushNotificationsEnabled}
          disabled={savingField === "pushNotificationsEnabled"}
          onChange={() => void toggleSetting("pushNotificationsEnabled", !settings.pushNotificationsEnabled)}
        />
      </section>

      <section className="rounded-3xl border border-border/40 bg-foreground/[0.03] p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Appearance</h2>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/15 p-3">
          <div>
            <p className="text-sm text-foreground/85">Theme</p>
            <p className="text-xs text-foreground/50">Choose the app appearance for your account.</p>
          </div>
          <div className="inline-flex rounded-xl border border-primary/20 p-1 bg-background/70">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest transition ${
                theme === "light" ? "bg-primary/20 text-primary" : "text-foreground/55"
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest transition ${
                theme === "dark" ? "bg-primary/20 text-primary" : "text-foreground/55"
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/40 bg-foreground/[0.03] p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/60">Account</h2>
        <Field label="Member ID" value={user?.id ?? "—"} />
        <Field label="Phone" value={user?.phone ?? "—"} />
        <ToggleRow
          label="Profile visibility"
          description="Allow your approved profile to appear in private discovery."
          checked={settings.profileVisible}
          disabled={savingField === "profileVisible"}
          onChange={() => void toggleSetting("profileVisible", !settings.profileVisible)}
        />
        <ToggleRow
          label="Show online status"
          description="Let matches view whether you're active in the app."
          checked={settings.showOnlineStatus}
          disabled={savingField === "showOnlineStatus"}
          onChange={() => void toggleSetting("showOnlineStatus", !settings.showOnlineStatus)}
        />
      </section>

      {settingsMessage ? <p className="text-xs text-emerald-300">{settingsMessage}</p> : null}
      {settingsError ? <p className="text-xs text-red-200">{settingsError}</p> : null}

      <section className="rounded-3xl border border-red-400/20 bg-red-500/5 p-5 space-y-4">
        <h2 className="text-sm uppercase tracking-[0.2em] text-red-200">Security</h2>

        <button
          type="button"
          disabled={logoutPending}
          onClick={() => void onLogout()}
          className="w-full rounded-xl border border-primary/30 px-4 py-3 text-sm text-primary disabled:opacity-60"
        >
          {logoutPending ? "Signing out…" : "Logout"}
        </button>

        <div className="space-y-2 rounded-2xl border border-red-300/25 p-4">
          <p className="text-sm text-red-100">Delete my account</p>
          <p className="text-xs text-red-100/70">
            This deactivates your membership, removes app access, and takes your profile out of discoverability.
          </p>
          <textarea
            rows={2}
            placeholder="Optional reason"
            value={deleteReason}
            onChange={(event) => setDeleteReason(event.target.value)}
            className="w-full rounded-xl border border-red-300/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-red-300/40"
          />
          <input
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="w-full rounded-xl border border-red-300/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-red-300/40"
          />
          <button
            type="button"
            onClick={() => void onDeleteAccount()}
            disabled={deleting || !canDelete}
            className="w-full rounded-xl border border-red-300/40 px-4 py-3 text-sm text-red-100 disabled:opacity-40"
          >
            {deleting ? "Processing…" : "Delete account"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ProfileReadView({ profile }: { profile: ProfileViewModel }) {
  return (
    <section className="rounded-3xl border border-border/40 bg-foreground/[0.03] p-5 space-y-4">
      <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/50">Profile Details</h2>
      <Field label="Date of birth" value={formatDate(profile.dateOfBirth)} />
      <Field label="Gender" value={profile.gender ? profile.gender.replaceAll("_", " ") : "—"} />
      <Field label="Height" value={profile.height ?? (profile.heightCm ? `${profile.heightCm} cm` : "—")} />
      <Field label="Profession" value={profile.profession || "—"} />
      <Field label="Place" value={profile.place || profile.location || "—"} />
      <Field label="Bio" value={profile.bio || profile.story || "—"} multiline />
    </section>
  );
}

function ProfileEditForm({ profile, onCancel, onSaved }: { profile: ProfileViewModel; onCancel: () => void; onSaved: (message: string) => Promise<void> }) {
  const [name, setName] = useState(profile.name);
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "");
  const [gender, setGender] = useState<Gender | "">(profile.gender ?? "");
  const [heightCm, setHeightCm] = useState(profile.heightCm ? String(profile.heightCm) : "");
  const [profession, setProfession] = useState(profile.profession);
  const [place, setPlace] = useState(profile.place || profile.location);
  const [bio, setBio] = useState(profile.bio || profile.story);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const validationError = useMemo(() => {
    if (name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!dateOfBirth) return "Date of birth is required.";
    const age = calculateAgeFromDate(dateOfBirth);
    if (!age || age < 18) return "Members must be at least 18 years old.";
    if (!gender) return "Please select gender.";
    const parsedHeight = Number(heightCm);
    if (!Number.isFinite(parsedHeight) || parsedHeight < MIN_HEIGHT || parsedHeight > MAX_HEIGHT) {
      return `Height must be between ${MIN_HEIGHT} and ${MAX_HEIGHT} cm.`;
    }
    if (profession.trim().length < 2) return "Profession must be at least 2 characters.";
    if (place.trim().length < 2) return "Place must be at least 2 characters.";
    if (bio.trim().length < 20) return "Bio must be at least 20 characters.";
    return "";
  }, [bio, dateOfBirth, gender, heightCm, name, place, profession]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationError) return;
    setSaving(true);
    setError("");

    try {
      await apiRequest("/profile", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          name: name.trim(),
          displayName: name.trim(),
          dateOfBirth,
          gender,
          heightCm: Number(heightCm),
          profession: profession.trim(),
          city: place.trim(),
          place: place.trim(),
          locationLabel: place.trim(),
          bioShort: bio.trim(),
          bio: bio.trim(),
          story: bio.trim(),
          intent: "dating"
        })
      });
      await onSaved("Profile updated successfully.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save profile details right now.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-primary/20 bg-primary/5 p-5 space-y-3">
      <h2 className="text-sm uppercase tracking-[0.2em] text-primary">Edit Profile</h2>
      <TextInput label="Name" value={name} onChange={setName} />
      <TextInput label="Date of birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-foreground/50">Gender</label>
        <select
          value={gender}
          onChange={(event) => setGender(event.target.value as Gender)}
          className="w-full rounded-xl border border-primary/20 bg-transparent px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Select</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="NON_BINARY">Non-binary</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <TextInput label="Height (cm)" value={heightCm} onChange={setHeightCm} inputMode="numeric" />
      <TextInput label="Profession" value={profession} onChange={setProfession} />
      <TextInput label="Place" value={place} onChange={setPlace} />
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-foreground/50">Bio</label>
        <textarea
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="w-full rounded-xl border border-primary/20 bg-transparent px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>
      {validationError ? <p className="text-xs text-amber-300">{validationError}</p> : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving || Boolean(validationError)} className="btn-vael-primary disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/65">
          Cancel
        </button>
      </div>
    </form>
  );
}

function PhotoManager({ profile, onUpdated }: { profile: ProfileViewModel; onUpdated: (message: string) => Promise<void> }) {
  const photos = profile.photos;
  const canUpload = photos.length < MAX_PHOTOS;
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canUpload) return;

    setUploading(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      await apiRequest("/photos/upload", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ filename: file.name, dataUrl, cropX: 0, cropY: 0, cropZoom: 1 })
      });
      await onUpdated("Photo uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoId: string) => {
    setBusyPhotoId(photoId);
    setError("");
    try {
      await apiRequest(`/photos/${photoId}`, { method: "DELETE", auth: true });
      await onUpdated("Photo removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove photo.");
    } finally {
      setBusyPhotoId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border/40 bg-foreground/[0.03] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/50">Photos</h2>
        <span className="text-[11px] text-foreground/55">{photos.length}/{MAX_PHOTOS}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
          const photo = photos[index];
          return (
            <div key={index} className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-primary/20 bg-foreground/[0.03]">
              {photo ? (
                <>
                  <img src={photo.url} alt={`Profile ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    disabled={busyPhotoId === photo.id || photos.length <= MIN_PHOTOS}
                    onClick={() => void removePhoto(photo.id)}
                    className="absolute right-1 top-1 rounded-full bg-background/75 p-1.5 text-red-300 disabled:opacity-40"
                  >
                    {busyPhotoId === photo.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-foreground/35">Empty</div>
              )}
            </div>
          );
        })}
      </div>
      <label className={`inline-flex items-center gap-2 rounded-xl border border-primary/30 px-3 py-2 text-xs uppercase tracking-[0.2em] ${canUpload && !uploading ? "cursor-pointer text-primary" : "cursor-not-allowed text-foreground/40"}`}>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={!canUpload || uploading} onChange={(event) => void handleUpload(event)} />
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} {uploading ? "Uploading" : canUpload ? "Add photo" : "Max reached"}
      </label>
      <p className="text-xs text-foreground/55">Maintain 1 to 3 photos at all times for active membership visibility.</p>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </section>
  );
}

function MembershipSummary({ profile }: { profile: ProfileViewModel }) {
  return (
    <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5 space-y-3">
      <h2 className="text-sm uppercase tracking-[0.2em] text-primary inline-flex items-center gap-2"><ShieldCheck size={14} /> Membership</h2>
      <Field label="Plan" value={formatPaymentPlan(profile.subscription.paymentPlan) || profile.subscription.tier} />
      <Field label="Status" value={profile.subscription.status} />
      <Field label="Amount" value={formatMoneyInr(profile.subscription.paymentAmount)} />
      <Field label="Validity" value={profile.subscription.endsAt ? `Valid until ${formatDate(profile.subscription.endsAt)}` : "—"} />
      <Field label="Renewal" value={profile.subscription.renewalMode === "AUTO" ? "Auto" : "Manual renewal only"} />
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div className="px-6 py-8 space-y-4 animate-pulse">
      <div className="h-5 w-28 rounded bg-foreground/10" />
      <div className="h-36 rounded-3xl bg-foreground/10" />
      <div className="h-40 rounded-3xl bg-foreground/10" />
      <div className="h-56 rounded-3xl bg-foreground/10" />
    </div>
  );
}

function TextInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "text" | "numeric";
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-foreground/50">{props.label}</label>
      <input
        type={props.type ?? "text"}
        value={props.value}
        inputMode={props.inputMode}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full rounded-xl border border-primary/20 bg-transparent px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}

function Field({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">{label}</p>
      <p className={`mt-1 text-sm text-foreground/90 ${multiline ? "leading-relaxed" : ""}`}>{value}</p>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className="w-full rounded-2xl border border-primary/15 p-3 flex items-center justify-between text-left disabled:opacity-60"
    >
      <div>
        <p className="text-sm text-foreground/85">{label}</p>
        <p className="text-xs text-foreground/50 mt-1">{description}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-[10px] tracking-[0.18em] uppercase ${
          checked ? "bg-primary/20 text-primary" : "bg-foreground/10 text-foreground/50"
        }`}
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
