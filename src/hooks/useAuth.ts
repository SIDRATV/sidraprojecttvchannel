import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

// Simple in-memory profile cache to avoid re-fetching on token refresh
const profileCache = new Map<string, User>();

const fetchUserProfile = async (userId: string): Promise<User | null> => {
  // Return cached profile if available
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
      // PGRST116 = no row found — user has auth but no profile yet
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

  useEffect(() => {
    // Safety timeout — if auth never resolves, unblock the UI after 5s
    const safetyTimer = setTimeout(() => {
      console.warn('[useAuth] Auth timeout — forcing loading=false');
      setLoading(false);
    }, 5_000);

    // Use ONLY onAuthStateChange — it fires INITIAL_SESSION on mount
    // with the current localStorage session. No separate getSession() needed.
    // Using both causes 2 concurrent profile fetches (race condition).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // TOKEN_REFRESHED and USER_UPDATED don't need a full profile re-fetch
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          return;
        }

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          // Clear cache on sign out
          profileCache.clear();
          setUser(null);
        }

        clearTimeout(safetyTimer);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};

