'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface Match {
  id: string;
  name: string;
  age: number;
  location: string;
  photos: string[];
  bio: string;
  verified: boolean;
}

export default function AppHomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const response = await apiClient.getMatches();
        setMatches(response.matches || []);
      } catch (error) {
        console.error('Failed to load matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--border-color)] border-t-[var(--accent-primary)] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--text-secondary)]">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen px-6 pt-28 pb-24 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">No Matches Yet</h2>
          <p className="text-sm text-[var(--text-secondary)]">Check back soon for new verified matches</p>
        </div>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];

  const handleConnect = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePass = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="pt-20 pb-24 px-6">
      <div className="space-y-4">
        {/* Profile card */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          {currentMatch.photos && currentMatch.photos.length > 0 ? (
            <img
              src={currentMatch.photos[0]}
              alt={currentMatch.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-serif font-bold">
                {currentMatch.name}, {currentMatch.age}
              </h3>
              {currentMatch.verified && (
                <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{currentMatch.location}</p>
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{currentMatch.bio}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePass}
            className="flex-1 py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl font-semibold transition-all duration-200 hover:bg-[var(--bg-tertiary)] active:scale-98"
          >
            Pass
          </button>
          <button
            onClick={handleConnect}
            className="flex-1 py-4 px-6 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-xl font-semibold transition-all duration-200 hover:opacity-90 active:scale-98"
          >
            Connect
          </button>
        </div>

        <p className="text-center text-xs text-[var(--text-tertiary)]">
          {currentIndex + 1} of {matches.length}
        </p>
      </div>
    </div>
  );
}
