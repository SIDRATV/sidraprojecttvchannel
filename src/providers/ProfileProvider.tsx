'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProfileData {
  fullName: string;
  bio: string;
  profilePhoto: string | null;
  accountTier: 'free' | 'premium' | 'pro' | 'vip';
  emailNotifications: boolean;
  contentNotifications: boolean;
  weeklyDigest: boolean;
  memberSince: string;
}

const defaultProfile: ProfileData = {
  fullName: 'User',
  bio: 'Passionate about Islamic media and innovative projects',
  profilePhoto: null,
  accountTier: 'free',
  emailNotifications: true,
  contentNotifications: true,
  weeklyDigest: false,
  memberSince: 'January 15, 2024',
};

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (data: ProfileData) => void;
  loadProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export { ProfileContext };

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);

  // Load profile from localStorage on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const updateProfile = (data: ProfileData) => {
    try {
      localStorage.setItem('userProfile', JSON.stringify(data));
      setProfile(data);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, loadProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
