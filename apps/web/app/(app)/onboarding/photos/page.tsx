"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { apiRequestAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type UploadedPhoto = { id: string; url: string; photoIndex?: number | null };

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

  const loadPhotos = async () => {
    const data = await apiRequestAuth<{ photos: UploadedPhoto[] }>("/photos/me");
    const ordered = [...data.photos].sort((a, b) => (a.photoIndex ?? 0) - (b.photoIndex ?? 0));
    setPhotos(ordered.slice(0, MAX_PHOTOS));
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        await loadPhotos();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load photos.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const canUpload = photos.length < MAX_PHOTOS;
  const canComplete = photos.length >= MIN_PHOTOS;

  const statusLabel = useMemo(() => {
    if (photos.length === 0) return "Upload at least one portrait.";
    if (photos.length < MAX_PHOTOS) return `${photos.length} of ${MAX_PHOTOS} portraits uploaded.`;
    return "Maximum portraits uploaded.";
  }, [photos.length]);

  const persistOrder = async (next: UploadedPhoto[]) => {
    await apiRequestAuth("/me/profile", {
      method: "PATCH",
      body: JSON.stringify({ photos: next.map((photo, index) => ({ id: photo.id, photoIndex: index })) })
    });
  };

  const handleFilePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canUpload) return;

    setUploading(true);
    setError("");

    try {
      const dataUrl = await fileToDataUrl(file);
      const upload = await apiRequestAuth<{ uploadToken: string }>("/me/profile/photos/presigned-url", {
        method: "POST",
        body: JSON.stringify({ filename: file.name, mimeType: file.type || "image/jpeg" })
      });
      await apiRequestAuth<{ photo: UploadedPhoto }>("/me/profile/photos/confirm", {
        method: "POST",
        body: JSON.stringify({ uploadToken: upload.uploadToken, filename: file.name, dataUrl, cropX: 0, cropY: 0, cropZoom: 1 })
      });
      await loadPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoId: string) => {
    if (photos.length <= MIN_PHOTOS) return;
    setError("");
    try {
      await apiRequestAuth(`/photos/${photoId}`, { method: "DELETE" });
      await loadPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove photo.");
    }
  };

  const movePhoto = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setPhotos(next);
    try {
      await persistOrder(next);
      await loadPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reorder photos.");
    }
  };

  const finishOnboarding = async () => {
    if (!canComplete) return;
    setFinishing(true);
    setError("");

    try {
      await apiRequestAuth("/me/profile/complete", { method: "POST", body: JSON.stringify({}) });
      await refreshCurrentUser();
      completeOnboardingStep("COMPLETED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete onboarding.");
    } finally {
      setFinishing(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center text-sm text-foreground/50">Loading your gallery…</div>;

  return (
    <div className="flex h-full flex-col px-8 mobile-onboarding-content">
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
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button onClick={() => void movePhoto(index, -1)} disabled={index === 0} className="rounded bg-background/80 px-1 text-xs disabled:opacity-40">←</button>
                    <button onClick={() => void movePhoto(index, 1)} disabled={index === photos.length - 1} className="rounded bg-background/80 px-1 text-xs disabled:opacity-40">→</button>
                    <button onClick={() => void removePhoto(photo.id)} disabled={photos.length <= MIN_PHOTOS} className="rounded bg-background/80 px-2 py-1 text-[10px] uppercase disabled:opacity-40">Remove</button>
                  </div>
                </>
              ) : <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-foreground/35">Empty</div>}
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
        <button onClick={() => void finishOnboarding()} disabled={!canComplete || finishing} className={`btn-vael-primary ${!canComplete || finishing ? "cursor-not-allowed opacity-30 grayscale" : ""}`}>
          {finishing ? "Finalizing…" : "Complete Onboarding"}
        </button>
      </div>
    </div>
  );
}
