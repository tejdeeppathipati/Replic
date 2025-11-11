"use client";

import { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { getUserProfile, getInitials, signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

export function UserProfileButton() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse" />
    );
  }

  if (!profile) {
    return null;
  }

  const displayName = profile.full_name || profile.first_name || profile.email?.split('@')[0] || 'User';
  const initials = getInitials(profile.full_name || profile.first_name || profile.email);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg p-2 transition-colors"
      >
        {/* Avatar with initials */}
        <div className="w-10 h-10 rounded-full bg-[#1D9BF0] flex items-center justify-center text-white font-mono font-bold text-sm">
          {initials}
        </div>
        {/* Name - only show on larger screens */}
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-mono font-semibold text-neutral-900 dark:text-white">
            {displayName}
          </span>
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            {profile.email}
          </span>
        </div>
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown content */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-20">
            {/* User info */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1D9BF0] flex items-center justify-center text-white font-mono font-bold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-semibold text-neutral-900 dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate">
                    {profile.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/dashboard/settings');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-mono text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
              >
                <User className="h-4 w-4" />
                Account Settings
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-mono text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
