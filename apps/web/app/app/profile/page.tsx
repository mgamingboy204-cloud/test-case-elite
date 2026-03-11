'use client';

import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  photos: string[];
  bio: string;
  location: string;
}

export default function ProfilePage() {
  const { userId } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiClient.getProfile();
        const profileData = response.profile;
        if (!profileData) {
          setProfile(null);
          return;
        }

        const photos = response.photos.map((photo) => photo.url);
        const [firstName = '', ...lastNameParts] = profileData.name.split(' ');

        setProfile({
          firstName,
          lastName: lastNameParts.join(' '),
          email: '',
          photos,
          bio: profileData.bioShort,
          location: profileData.city,
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="pt-24 pb-24 px-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--border-color)] border-t-[var(--accent-primary)] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--text-secondary)]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-6 space-y-6">
      <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)]">My Profile</h1>

      {profile ? (
        <div className="space-y-6">
          {/* Profile photos */}
          {profile.photos && profile.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {profile.photos.map((photo, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Profile info */}
          <div className="space-y-4 bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Name</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {profile.firstName} {profile.lastName}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Location</p>
              <p className="text-base text-[var(--text-secondary)]">{profile.location || 'Not specified'}</p>
            </div>

            <div>
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Bio</p>
              <p className="text-base text-[var(--text-secondary)]">{profile.bio || 'Not specified'}</p>
            </div>
          </div>

          {/* Edit button */}
          <button className="w-full py-3 px-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg font-semibold transition-all duration-200 hover:opacity-90 active:scale-98">
            Edit Profile
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)]">Profile not found</p>
        </div>
      )}
    </div>
  );
}
