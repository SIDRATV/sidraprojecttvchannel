'use client';

import React, { createContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// ─── Public contract ─────────────────────────────────────────────────────────
export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  isPasswordRecovery: boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  isPasswordRecovery: false,
  refreshUser: async () => {},
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const profileCache = new Map<string, User>();

const toAppUser = (authUser: SupabaseUser): User => ({
  id: authUser.id,
  email: authUser.email || '',
  username: (authUser.user_metadata?.username as string | null | undefined) ?? null,
  full_name:
    (authUser.user_metadata?.full_name as string | undefined) ||
    (authUser.user_metadata?.name as string | undefined) ||
    authUser.email?.split('@')[0] ||
    'User',
  avatar_url: (authUser.user_metadata?.avatar_url as string | null | undefined) ?? null,
  bio: null,
  created_at: authUser.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_admin: false,
});

const fetchUserProfile = async (authUser: SupabaseUser): Promise<User> => {
  const userId = authUser.id;
  if (profileCache.has(userId)) return profileCache.get(userId)!;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) return toAppUser(authUser);
    const profile = data || toAppUser(authUser);
    profileCache.set(userId, profile);
    return profile;
  } catch {
    return toAppUser(authUser);
  }
};

const mergeProfile = (base: User, profile: User): User => ({
  ...base,
  ...profile,
  email: profile.email || base.email,
  full_name: profile.full_name || base.full_name,
});

// ─── Sync read from localStorage — eliminates null flash on reload ────────────
// Supabase JS v2 without custom storageKey uses: sb-{projectRef}-auth-token
// We derive the key the same way to guarantee a match.
const getStorageKey = (): string => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const ref = new URL(url).hostname.split('.')[0];
    return `sb-${ref}-auth-token`;
  } catch {
    return '';
  }
};

const OLD_STORAGE_KEY = 'sb-sidra-auth';
const LAST_ACTIVE_KEY = 'sidra_last_active';
const INACTIVITY_LIMIT_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

const readStoredSession = (): { user: User | null; session: Session | null } => {
  if (typeof window === 'undefined') return { user: null, session: null };
  try {
    // Check inactivity: if user hasn't opened app in 5 days → treat as logged out
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActive && Date.now() - Number(lastActive) > INACTIVITY_LIMIT_MS) {
      // Clear stale data
      const key = getStorageKey();
      if (key) localStorage.removeItem(key);
      localStorage.removeItem(OLD_STORAGE_KEY);
      localStorage.removeItem(LAST_ACTIVE_KEY);
      return { user: null, session: null };
    }

    const key = getStorageKey();
    // Try new key first, fall back to old custom key (for migration)
    const raw = (key ? localStorage.getItem(key) : null) || localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return { user: null, session: null };
    const stored = JSON.parse(raw) as Session & { expires_at?: number } | null;
    if (!stored?.user) return { user: null, session: null };

    // Check if the access token expired long ago (> 1 hour) — refresh will likely fail
    if (stored.expires_at) {
      const expiredMs = Date.now() / 1000 - stored.expires_at;
      // If expired more than 7 days ago, refresh token is almost certainly dead
      if (expiredMs > 7 * 24 * 60 * 60) {
        return { user: null, session: null };
      }
    }

    // Mark activity
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    return { user: toAppUser(stored.user), session: stored };
  } catch {
    return { user: null, session: null };
  }
};

// ─── Detect recovery hash before any render ──────────────────────────────────
const detectRecoveryHash = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  return hash.includes('type=recovery') || hash.includes('type=magiclink');
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = useMemo(() => readStoredSession(), []);

  const [user, setUser] = useState<User | null>(stored.user);
  const [session, setSession] = useState<Session | null>(stored.session);
  // Always start ready — if no stored user, ProtectedRoute redirects instantly
  // If stored user exists, dashboard renders immediately (getSession refreshes in bg)
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(true);
  // Detect recovery mode from URL hash immediately (before onAuthStateChange fires)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(detectRecoveryHash);

  const currentUserIdRef = useRef<string | null>(stored.user?.id ?? null);
  const requestIdRef = useRef(0);

  const refreshUser = useCallback(async () => {
    const s = await supabase.auth.getSession();
    const authUser = s.data.session?.user;
    if (!authUser) return;
    profileCache.delete(authUser.id);
    const profile = await fetchUserProfile(authUser);
    setUser(mergeProfile(toAppUser(authUser), profile));
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Migrate: copy old custom storageKey to new default key so Supabase finds the session
    if (typeof window !== 'undefined') {
      const newKey = getStorageKey();
      if (newKey && !localStorage.getItem(newKey)) {
        const old = localStorage.getItem(OLD_STORAGE_KEY);
        if (old) {
          localStorage.setItem(newKey, old);
          localStorage.removeItem(OLD_STORAGE_KEY);
        }
      }
    }

    const applySession = async (s: Session | null, rid: number) => {
      if (!s?.user) {
        currentUserIdRef.current = null;
        profileCache.clear();
        document.cookie = 'sidra_uid=; path=/; max-age=0; SameSite=Lax';
        if (!cancelled && rid === requestIdRef.current) {
          setUser(null);
          setSession(null);
        }
        return;
      }

      currentUserIdRef.current = s.user.id;
      document.cookie = `sidra_uid=${s.user.id}; path=/; max-age=${60 * 60 * 24 * 5}; SameSite=Lax`;
      // Track activity for 5-day inactivity expiry
      localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));

      // Set immediately from token metadata (no DB wait)
      const authUser = toAppUser(s.user);
      if (!cancelled && rid === requestIdRef.current) {
        setSession(s);
        setUser(prev => prev?.id === authUser.id ? mergeProfile(authUser, prev) : authUser);
      }

      // Enrich from DB in background
      const profile = await fetchUserProfile(s.user);
      if (!cancelled && rid === requestIdRef.current) {
        setUser(mergeProfile(authUser, profile));
      }
    };

    // Safety net: never freeze the UI
    const safetyTimer = setTimeout(() => {
      if (!cancelled) { setLoading(false); setInitialized(true); }
    }, 3_000);

    // Step 1: get confirmed session from Supabase (handles token refresh)
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelled) return;
      const rid = ++requestIdRef.current;
      await applySession(s, rid);
      clearTimeout(safetyTimer);
      if (!cancelled) { setLoading(false); setInitialized(true); }
    }).catch(() => {
      if (!cancelled) { setLoading(false); setInitialized(true); clearTimeout(safetyTimer); }
    });

    // Step 2: react to auth events (sign in/out from other tabs, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelled) return;

      // Token refreshed — just update session + ensure user is set
      if (event === 'TOKEN_REFRESHED') {
        if (s) {
          currentUserIdRef.current = s.user.id;
          setSession(s);
          setUser(prev => prev ?? toAppUser(s.user));
        }
        return;
      }

      // Ignore non-state-changing events
      if (event === 'USER_UPDATED' || event === 'INITIAL_SESSION') return;

      // PASSWORD_RECOVERY: user clicked a reset link. Set the flag so the app
      // does NOT treat them as fully signed-in (prevents redirect to dashboard).
      // The reset-password page reads `isPasswordRecovery` to show the form.
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        if (s) {
          setSession(s);
        }
        return;
      }

      // For SIGNED_IN: only update if it's a different user
      if (event === 'SIGNED_IN') {
        if (s?.user && s.user.id === currentUserIdRef.current) return;
        const rid = ++requestIdRef.current;
        applySession(s, rid).then(() => {
          if (!cancelled) { setLoading(false); setInitialized(true); }
        });
        return;
      }

      // For SIGNED_OUT: only clear if we actually have a user
      if (event === 'SIGNED_OUT') {
        if (!currentUserIdRef.current) return; // already signed out
        const rid = ++requestIdRef.current;
        applySession(null, rid);
        return;
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, loading, initialized, isPasswordRecovery, refreshUser }),
    [user, session, loading, initialized, isPasswordRecovery, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
