import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

// In-memory profile cache — avoids redundant DB queries on token refresh
const profileCache = new Map<string, User>();

const toAppUser = (authUser: SupabaseUser): User => ({
  id: authUser.id,
  email: authUser.email || "",
  username: (authUser.user_metadata?.username as string | null | undefined) ?? null,
  full_name:
    (authUser.user_metadata?.full_name as string | undefined) ||
    (authUser.user_metadata?.name as string | undefined) ||
    authUser.email?.split("@")[0] ||
    "User",
  avatar_url: (authUser.user_metadata?.avatar_url as string | null | undefined) ?? null,
  bio: null,
  created_at: authUser.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_admin: false,
});

const fetchUserProfile = async (authUser: SupabaseUser): Promise<User> => {
  const userId = authUser.id;

  if (profileCache.has(userId)) {
    return profileCache.get(userId)!;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error('[useAuth] Profile fetch error:', error.message);
      return toAppUser(authUser);
    }

    const profile = data || toAppUser(authUser);
    profileCache.set(userId, profile);
    return profile;
  } catch (err) {
    console.error('[useAuth] Profile fetch exception:', err);
    return toAppUser(authUser);
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  // Track the last userId we fetched so listeners don't re-fetch unnecessarily
  const lastUserIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (session: Session | null) => {
      const requestId = ++requestIdRef.current;

      if (!session?.user) {
        lastUserIdRef.current = null;
        profileCache.clear();
        if (!cancelled && requestId === requestIdRef.current) {
          setUser(null);
        }
        return;
      }

      lastUserIdRef.current = session.user.id;
      const profile = await fetchUserProfile(session.user);

      if (!cancelled && requestId === requestIdRef.current) {
        setUser(profile);
      }
    };

    // Safety timeout — unblock UI if auth never resolves
    const safetyTimer = setTimeout(() => {
      console.warn('[useAuth] Auth timeout — forcing loading=false');
      if (!cancelled) {
        setLoading(false);
        setInitialized(true);
      }
    }, 8_000);

    // Step 1: Read session from localStorage immediately (synchronous-like).
    // This is the ONLY reliable way in Next.js App Router — onAuthStateChange
    // alone can fire INITIAL_SESSION with null before localStorage is read.
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (cancelled) return;

        await applySession(session);

        clearTimeout(safetyTimer);
        if (!cancelled) {
          setLoading(false);
          setInitialized(true);
        }
      })
      .catch((error) => {
        console.error('[useAuth] getSession error:', error);
        if (!cancelled) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
          clearTimeout(safetyTimer);
        }
      });

    // Step 2: Listen for real auth changes AFTER initial load
    // (sign in, sign out, token refresh from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;

        // Ignore background auth maintenance events.
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          return;
        }

        // Skip if same user — already loaded by getSession() above
        if (session?.user && session.user.id === lastUserIdRef.current) {
          return;
        }

        await applySession(session);

        if (!cancelled) {
          setLoading(false);
          setInitialized(true);
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, initialized };
};


