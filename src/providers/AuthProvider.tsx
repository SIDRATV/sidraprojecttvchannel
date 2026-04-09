'use client';

import React, { createContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// ─── Public contract ────────────────────────────────────────────────
export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;       // true while first getSession() is in flight
  initialized: boolean;   // true once first getSession() has resolved
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  refreshUser: async () => {},
});

// ─── Helpers (module-level, shared across renders) ─────────────────
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

    if (error) {
      console.error('[AuthProvider] Profile fetch error:', error.message);
      return toAppUser(authUser);
    }

    const profile = data || toAppUser(authUser);
    profileCache.set(userId, profile);
    return profile;
  } catch (err) {
    console.error('[AuthProvider] Profile fetch exception:', err);
    return toAppUser(authUser);
  }
};

const mergeProfile = (base: User, profile: User): User => ({
  ...base,
  ...profile,
  email: profile.email || base.email,
  full_name: profile.full_name || base.full_name,
});

// ─── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const lastUserIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  // Refresh user profile from DB (clears cache)
  const refreshUser = useCallback(async () => {
    const currentSession = session;
    if (!currentSession?.user) return;
    profileCache.delete(currentSession.user.id);
    const profile = await fetchUserProfile(currentSession.user);
    const authUser = toAppUser(currentSession.user);
    setUser(mergeProfile(authUser, profile));
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    /** Apply a Supabase session → derive User immediately, then enrich from DB */
    const applySession = async (s: Session | null) => {
      const rid = ++requestIdRef.current;

      if (!s?.user) {
        lastUserIdRef.current = null;
        profileCache.clear();
        // Remove uid cookie on sign-out
        document.cookie = 'sidra_uid=; path=/; max-age=0; SameSite=Lax';
        if (!cancelled && rid === requestIdRef.current) {
          setUser(null);
          setSession(null);
        }
        return;
      }

      lastUserIdRef.current = s.user.id;

      // Set uid cookie for middleware maintenance exemption check
      document.cookie = `sidra_uid=${s.user.id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

      // 1) Immediately set user from auth metadata — no network wait
      const authUser = toAppUser(s.user);
      if (!cancelled && rid === requestIdRef.current) {
        setSession(s);
        setUser((prev) =>
          prev?.id === authUser.id ? mergeProfile(authUser, prev) : authUser,
        );
      }

      // 2) Enrich with DB profile (non-blocking for UI)
      const profile = await fetchUserProfile(s.user);
      if (!cancelled && rid === requestIdRef.current) {
        setUser(mergeProfile(authUser, profile));
      }
    };

    // Safety timeout — never block UI forever
    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        console.warn('[AuthProvider] Auth timeout — forcing initialized');
        setLoading(false);
        setInitialized(true);
      }
    }, 5_000);

    // ── Step 1: Read persisted session (sync-like) ──
    supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        if (cancelled) return;
        await applySession(s);
        clearTimeout(safetyTimer);
        if (!cancelled) {
          setLoading(false);
          setInitialized(true);
        }
      })
      .catch((err) => {
        console.error('[AuthProvider] getSession error:', err);
        if (!cancelled) {
          setUser(null);
          setSession(null);
          setLoading(false);
          setInitialized(true);
          clearTimeout(safetyTimer);
        }
      });

    // ── Step 2: Listen for real auth changes (sign-in / sign-out / other tab) ──
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (cancelled) return;

      // Update session on token refresh without re-fetching the profile
      if (event === 'TOKEN_REFRESHED') {
        if (s) {
          lastUserIdRef.current = s.user.id;
          setSession(s);
        }
        return;
      }
      if (event === 'USER_UPDATED') return;

      // Skip if same user already loaded
      if (s?.user && s.user.id === lastUserIdRef.current) return;

      await applySession(s);
      if (!cancelled) {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Stable context value — only changes when state changes
  const value = useMemo<AuthContextValue>(
    () => ({ user, session, loading, initialized, refreshUser }),
    [user, session, loading, initialized, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
