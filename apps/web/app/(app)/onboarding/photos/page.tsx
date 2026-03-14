"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";

const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
];

export default function PhotosSetup() {
  const { completeOnboardingStep, refreshCurrentUser } = useAuth();
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const MAX_PHOTOS = 3;
  const canAdd = photos.length < MAX_PHOTOS && !uploading;

  const toDataUrl = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to read image"));
      reader.readAsDataURL(blob);
    });
  };

  const addPhoto = async () => {
    if (!canAdd) return;
    setUploading(true);
    setError("");
    try {
      const image = SAMPLE_PHOTOS[photos.length % SAMPLE_PHOTOS.length];
      const dataUrl = await toDataUrl(image);
      const result = await apiRequest<{ photo: { url: string } }>("/photos/upload", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ filename: `photo-${Date.now()}.jpg`, dataUrl, cropX: 0, cropY: 0, cropZoom: 1 })
      });
      setPhotos(prev => [...prev, result.photo.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const isEnabled = photos.length >= 1;
  const isComplete = photos.length >= MAX_PHOTOS;

  const label = isComplete
    ? "Enter the Circle"
    : photos.length === 0
    ? "Add 1 Portrait to Continue"
    : `Add ${MAX_PHOTOS - photos.length} More ${MAX_PHOTOS - photos.length === 1 ? 'Portrait' : 'Portraits'}`;

  const finishOnboarding = async () => {
    if (!isEnabled) return;
    try {
      await apiRequest("/profile/complete", { method: "POST", auth: true, body: JSON.stringify({}) });
      await refreshCurrentUser();
      completeOnboardingStep("COMPLETED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete onboarding.");
    }
  };

  return (
    <div className="flex flex-col h-full px-8 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">

      {/* Header */}
      <div className="flex-none pt-6 mb-8">
        <h1 className="text-4xl font-serif text-foreground tracking-wide mb-2">
          Visual <span className="text-primary">Presence</span>.
        </h1>
        <p className="text-foreground/40 font-light uppercase tracking-widest text-[10px]">
          A minimum of 1 portrait is required. The gallery is curated to 3.
        </p>
      </div>

      {/* 3-slot Gallery */}
      <div className="flex-none grid grid-cols-3 gap-3 mb-8">
        {[0, 1, 2].map((index) => {
          const src = photos[index];
          const isNextSlot = index === photos.length && !uploading;
          const isLoading = uploading && index === photos.length;
          const isEmpty = !src && !isLoading;

          return (
            <div
              key={index}
              className={`aspect-[3/4] rounded-2xl relative overflow-hidden transition-all duration-400 ${
                src
                  ? 'border border-primary/20 shadow-[0_8px_24px_rgba(0,0,0,0.2)]'
                  : 'metallic-border bg-foreground/[0.02]'
              } ${isNextSlot && canAdd ? 'cursor-pointer hover:bg-foreground/[0.04]' : ''}`}
              onClick={() => isNextSlot && addPhoto()}
            >
              <AnimatePresence mode="wait">
                {src ? (
                  <motion.div
                    key="photo"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <img src={src} alt={`Portrait ${index + 1}`} className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                    <p className="absolute bottom-2 left-0 w-full text-center text-[7px] uppercase tracking-[0.25em] text-primary/80 font-semibold">
                      Index 0{index + 1}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ) : isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-5 h-5 border border-primary/30 border-t-primary rounded-full animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                  >
                    <Plus
                      size={18}
                      strokeWidth={1}
                      className={isNextSlot ? 'text-primary/50' : 'text-foreground/15'}
                    />
                    <span className="text-[7px] uppercase tracking-[0.3em] font-medium text-foreground/20">
                      {index === 0 ? 'Primary' : index === photos.length ? 'Add' : '—'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Status pills */}
      <div className="flex-none flex items-center justify-center gap-2 mb-8">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-400 ${
              i < photos.length ? 'w-6 bg-primary' : 'w-3 bg-foreground/15'
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="flex-none mt-auto">
        {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}
        <motion.button
          whileTap={isEnabled ? { scale: 0.97 } : {}}
          onClick={finishOnboarding}
          disabled={!isEnabled}
          className={`btn-elite-primary ${!isEnabled ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
        >
          {label}
        </motion.button>
      </div>
    </div>
  );
}
