import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

const fetchUserProfile = async (userId: string): Promise<User | null> => {
  try {
    console.log('[useAuth] Fetching profile for user:', userId);
    
    // Get current session to ensure we have a valid token
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[useAuth] Current session:', !!session, session?.access_token ? 'has token' : 'no token');
    
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error('[useAuth] Profile fetch error:', error);
      return null;
    }
    
    console.log('[useAuth] Profile fetched successfully:', data?.id);
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

    console.log('[useAuth] Initializing auth hook');

    // Resolve the current session on mount
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        console.log('[useAuth] getSession returned:', !!session);
        if (session?.user) {
          console.log('[useAuth] Session user found:', session.user.id);
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          console.log('[useAuth] No session user found');
          setUser(null);
        }
      })
      .catch((err) => {
        console.error('[useAuth] getSession error:', err);
        setUser(null);
      })
      .finally(() => {
        console.log('[useAuth] Initial load complete');
        setLoading(false);
      });

    // Keep in sync with auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth state change:', event, !!session);
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
