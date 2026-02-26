import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        // Check localStorage first (demo mode)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.debug("Invalid stored user data");
          }
          setLoading(false);
          return;
        }

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .single();

          setUser(userData || null);
        }
      } catch (error) {
        // Supabase not configured, skip auth - demo mode
        console.debug("Auth not available - demo mode");
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch (e) {
          console.debug("Invalid stored user data");
        }
      } else if (e.key === 'user' && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setUser(userData || null);
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    } catch (error) {
      console.debug("Auth listener setup skipped - demo mode");
    }
  }, []);

  return { user, loading };
};
