import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

// In-memory profile cache — avoids redundant DB queries on token refresh
const profileCache = new Map<string, User>();

const fetchUserProfile = async (userId: string): Promise<User | null> => {
  if (profileCache.has(userId)) {
    return profileCache.get(userId)!;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[useAuth] Profile fetch error:', error.message);
      }
      return null;
    }

    if (data) profileCache.set(userId, data);
    return data || null;
  } catch (err) {
    console.error('[useAuth] Profile fetch exception:', err);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Track the last userId we fetched so listeners don't re-fetch unnecessarily
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Safety timeout — unblock UI if auth never resolves
    const safetyTimer = setTimeout(() => {
      console.warn('[useAuth] Auth timeout — forcing loading=false');
      if (!cancelled) setLoading(false);
    }, 8_000);

    // Step 1: Read session from localStorage immediately (synchronous-like).
    // This is the ONLY reliable way in Next.js App Router — onAuthStateChange
    // alone can fire INITIAL_SESSION with null before localStorage is read.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      if (session?.user) {
        lastUserIdRef.current = session.user.id;
        const profile = await fetchUserProfile(session.user.id);
        if (!cancelled) setUser(profile);
      } else {
        lastUserIdRef.current = null;
        if (!cancelled) setUser(null);
      }

      clearTimeout(safetyTimer);
      if (!cancelled) setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setUser(null);
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    // Step 2: Listen for real auth changes AFTER initial load
    // (sign in, sign out, token refresh from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;

        // Skip events that don't change the user identity
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          return;
        }

        // Skip if same user — already loaded by getSession() above
        if (session?.user && session.user.id === lastUserIdRef.current) {
          return;
        }

        if (session?.user) {
          lastUserIdRef.current = session.user.id;
          const profile = await fetchUserProfile(session.user.id);
          if (!cancelled) {
            setUser(profile);
            setLoading(false);
          }
        } else {
          lastUserIdRef.current = null;
          profileCache.clear();
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};


