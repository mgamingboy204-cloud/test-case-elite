'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { setOnboardingData, getOnboardingData } from '@/lib/storage';

interface OnboardingPhotosProps {
  onNext: () => void;
  onBack: () => void;
}

export default function OnboardingPhotos({ onNext, onBack }: OnboardingPhotosProps) {
  const data = getOnboardingData();
  const [photoUrls, setPhotoUrls] = useState<string[]>(data.photoUrls || []);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    setIsUploading(true);
    setError('');

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please select image files only');
        setIsUploading(false);
        return;
      }

      try {
        const response = await apiClient.uploadPhoto(file);
        setPhotoUrls(prev => [...prev, response.url]);
      } catch (err: any) {
        setError(err.message || 'Failed to upload photo');
        break;
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (photoUrls.length === 0) {
      setError('Please upload at least one photo');
      return;
    }

    setOnboardingData({ photoUrls });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <button
          onClick={onBack}
          className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)]">
          Add Your Photos
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Upload at least one clear photo of yourself
        </p>
      </div>

      <div className="space-y-4">
        {/* Photo grid */}
        <div className="grid grid-cols-2 gap-3">
          {photoUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]"
            >
              <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-700 transition-colors"
              >
                ×
              </button>
            </div>
          ))}

          {photoUrls.length < 5 && (
            <label className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <div className="text-center">
                <p className="text-2xl mb-2">+</p>
                <p className="text-xs text-[var(--text-tertiary)]">Add Photo</p>
              </div>
            </label>
          )}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={isUploading || photoUrls.length === 0}
          className="w-full py-3 px-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg font-semibold transition-all duration-200 hover:opacity-90 active:scale-98 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Continue'}
        </button>

        <p className="text-xs text-[var(--text-tertiary)] text-center">
          Photos help us create better matches for you
        </p>
      </div>
    </div>
  );
}
