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
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  initialized: false,
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

const readStoredSession = (): { user: User | null; session: Session | null } => {
  if (typeof window === 'undefined') return { user: null, session: null };
  try {
    const key = getStorageKey();
    // Try new key first, fall back to old custom key (for migration)
    const raw = (key ? localStorage.getItem(key) : null) || localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return { user: null, session: null };
    const stored = JSON.parse(raw) as Session & { expires_at?: number } | null;
    if (!stored?.user) return { user: null, session: null };
    // Accept even expired sessions optimistically — getSession() will refresh
    return { user: toAppUser(stored.user), session: stored };
  } catch {
    return { user: null, session: null };
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = useMemo(() => readStoredSession(), []);

  const [user, setUser] = useState<User | null>(stored.user);
  const [session, setSession] = useState<Session | null>(stored.session);
  const [loading, setLoading] = useState(!stored.user); // skip loading if already have user
  const [initialized, setInitialized] = useState(!!stored.user); // instant if user in localStorage

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
      document.cookie = `sidra_uid=${s.user.id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

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
    () => ({ user, session, loading, initialized, refreshUser }),
    [user, session, loading, initialized, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
