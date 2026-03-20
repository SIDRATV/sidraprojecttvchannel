import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

const fetchUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    return data || null;
  } catch {
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

    // Resolve the current session on mount
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // Keep in sync with auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};
