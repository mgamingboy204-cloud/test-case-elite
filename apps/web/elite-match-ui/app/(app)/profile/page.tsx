"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

interface UserProfile {
  name: string;
  age: number;
  city: string;
  profession: string;
  bio: string;
  photos: { id: string; url: string; primary: boolean }[];
  verified: boolean;
}

const MOCK_PROFILE: UserProfile = {
  name: "Alex Johnson",
  age: 28,
  city: "Mumbai",
  profession: "Product Designer",
  bio: "Coffee lover, weekend hiker, and amateur photographer. Looking for genuine connections.",
  photos: [
    { id: "p1", url: "https://picsum.photos/seed/profile1/400/500", primary: true },
    { id: "p2", url: "https://picsum.photos/seed/profile2/400/500", primary: false },
    { id: "p3", url: "https://picsum.photos/seed/profile3/400/500", primary: false },
  ],
  verified: true,
};

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Edit fields */
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError(false);
    try {
      await apiFetch("/profile");
      setProfile(MOCK_PROFILE);
    } catch {
      setProfile(MOCK_PROFILE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio);
      setCity(profile.city);
      setProfession(profile.profession);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: { name, bio, city, profession } as never,
      });
      setProfile((prev) => (prev ? { ...prev, name, bio, city, profession } : prev));
      setEditing(false);
      addToast("Profile updated!", "success");
    } catch {
      addToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      /* stub */
    }
    addToast("Logged out", "info");
    router.push("/login");
  };

  const handleAddPhoto = () => {
    const id = Math.random().toString(36).slice(2, 8);
    if (profile && profile.photos.length < 6) {
      setProfile({
        ...profile,
        photos: [
          ...profile.photos,
          { id, url: `https://picsum.photos/seed/${id}/400/500`, primary: false },
        ],
      });
      addToast("Photo added!", "success");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px 0" }}>
        <Skeleton height={200} radius="var(--radius-lg)" style={{ marginBottom: 16 }} />
        <Skeleton height={120} radius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !profile) return <ErrorState onRetry={fetchProfile} />;

  return (
    <div className="fade-in" style={{ padding: "24px 0" }}>
      {/* Photos */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0 }}>Photos</h3>
          {profile.photos.length < 6 && (
            <Button variant="ghost" size="sm" onClick={handleAddPhoto}>
              + Add
            </Button>
          )}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {profile.photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                aspectRatio: "3/4",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                position: "relative",
                border: photo.primary ? "2px solid var(--primary)" : "1px solid var(--border)",
              }}
            >
              <img
                src={photo.url || "/placeholder.svg"}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                crossOrigin="anonymous"
              />
              {photo.primary && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    fontSize: 9,
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
            </div>
          ))}
        </div>
      </Card>

      {/* Profile info */}
      <Card style={{ padding: 24, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: 0 }}>{profile.name}</h2>
            {profile.verified && <Badge variant="success">Verified</Badge>}
          </div>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {!editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <InfoRow label="Age" value={String(profile.age)} />
            <InfoRow label="City" value={profile.city} />
            <InfoRow label="Profession" value={profile.profession} />
            <InfoRow label="Bio" value={profile.bio} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="Profession" value={profession} onChange={(e) => setProfession(e.target.value)} />
            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              charCount={{ current: bio.length, max: 300 }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <Button variant="secondary" fullWidth onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button fullWidth loading={saving} onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Button variant="secondary" fullWidth onClick={() => router.push("/settings")}>
          Settings
        </Button>
        <Button variant="danger" fullWidth onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 14, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
