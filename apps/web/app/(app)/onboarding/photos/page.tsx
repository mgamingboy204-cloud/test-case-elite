"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type UploadedPhoto = { id: string; url: string };

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

export default function OnboardingPhotosPage() {
  const { completeOnboardingStep, refreshCurrentUser } = useAuth();
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPhotos = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<{ photos: UploadedPhoto[] }>("/photos/me", { auth: true });
        setPhotos(data.photos.slice(0, MAX_PHOTOS));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load photos.");
      } finally {
        setLoading(false);
      }
    };

    void loadPhotos();
  }, []);

  const canUpload = photos.length < MAX_PHOTOS;
  const canComplete = photos.length >= MIN_PHOTOS;

  const statusLabel = useMemo(() => {
    if (photos.length === 0) return "Upload at least one portrait.";
    if (photos.length < MAX_PHOTOS) return `${photos.length} of ${MAX_PHOTOS} portraits uploaded.`;
    return "Maximum portraits uploaded.";
  }, [photos.length]);

  const handleFilePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canUpload) return;

    setUploading(true);
    setError("");

    try {
      const dataUrl = await fileToDataUrl(file);
      const response = await apiRequest<{ photo: UploadedPhoto }>("/photos/upload", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ filename: file.name, dataUrl, cropX: 0, cropY: 0, cropZoom: 1 })
      });
      setPhotos((prev) => [...prev, response.photo].slice(0, MAX_PHOTOS));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoId: string) => {
    setError("");
    try {
      await apiRequest(`/photos/${photoId}`, { method: "DELETE", auth: true });
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove photo.");
    }
  };

  const finishOnboarding = async () => {
    if (!canComplete) return;
    setFinishing(true);
    setError("");

    try {
      await apiRequest("/profile/complete", { method: "POST", auth: true, body: JSON.stringify({}) });
      await refreshCurrentUser();
      completeOnboardingStep("COMPLETED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete onboarding.");
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-foreground/50">Loading your gallery…</div>;
  }

  return (
    <div className="flex h-full flex-col px-8 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">
      <div className="pt-6 pb-6">
        <h1 className="text-4xl font-serif text-foreground tracking-wide">Photo <span className="text-primary">Upload</span></h1>
        <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-foreground/40">1 to 3 portraits required</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
          const photo = photos[index];
          return (
            <div key={index} className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-primary/20 bg-foreground/[0.03]">
              {photo ? (
                <>
                  <img src={photo.url} alt={`Portrait ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => void removePhoto(photo.id)}
                    className="absolute right-2 top-2 rounded-full bg-background/70 px-2 py-1 text-[10px] uppercase tracking-wider text-foreground/70"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-foreground/35">Empty</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-xs text-foreground/60">{statusLabel}</p>

        <label className={`block rounded-xl border border-primary/30 px-4 py-3 text-center text-xs uppercase tracking-[0.2em] ${canUpload && !uploading ? "cursor-pointer text-primary" : "cursor-not-allowed text-foreground/40"}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handleFilePick(event)} disabled={!canUpload || uploading} />
          {uploading ? "Uploading…" : canUpload ? "Upload portrait" : "Maximum reached"}
        </label>

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <button
          onClick={() => void finishOnboarding()}
          disabled={!canComplete || finishing}
          className={`btn-elite-primary ${!canComplete || finishing ? "cursor-not-allowed opacity-30 grayscale" : ""}`}
        >
          {finishing ? "Finalizing…" : "Complete Onboarding"}
        </button>
      </div>
    </div>
  );
}
