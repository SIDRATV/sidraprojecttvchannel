import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

// Pass the session token directly — never call getSession() inside getSession().then()
// Doing so deadlocks the Supabase auth queue and causes an infinite loading spinner on refresh.
const fetchUserProfile = async (userId: string, accessToken?: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error('[useAuth] Profile fetch error:', error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('[useAuth] Profile fetch exception:', err);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Safety timeout — if auth doesn't resolve in 10s, unblock the UI
    const safetyTimer = setTimeout(() => {
      console.warn('[useAuth] Auth timeout — forcing loading=false');
      setLoading(false);
    }, 10_000);

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id, session.access_token);
          setUser(profile);
        } else {
          setUser(null);
        }
      })
      .catch((err) => {
        console.error('[useAuth] getSession error:', err);
        setUser(null);
      })
      .finally(() => {
        clearTimeout(safetyTimer);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id, session.access_token);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};

