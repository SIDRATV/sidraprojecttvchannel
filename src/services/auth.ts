import { supabase } from "@/lib/supabase";

export const authService = {
  /**
   * Register a new user via server-side API (uses service role for profile insert).
   * Returns the session so the caller can set it on the Supabase client.
   */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    username: string
  ) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, username }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Restore session on the client so subsequent Supabase calls are authenticated
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    return data;
  },

  /**
   * Sign in with email OR username + password.
   * If identifier looks like a username (no @), resolve it to an email first.
   */
  async signIn(identifier: string, password: string) {
    let email = identifier.trim();

    if (!email.includes('@')) {
      // Resolve username → email via server-side API
      const resp = await fetch(
        `/api/auth/resolve-username?username=${encodeURIComponent(email)}`
      );
      const resolveData = await resp.json();

      if (!resp.ok) {
        throw new Error('Invalid username or password');
      }

      email = resolveData.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },


  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: { full_name?: string; bio?: string; avatar_url?: string }) {
    const { data, error } = await ((supabase.from("users") as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single() as any);

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

    return data.publicUrl;
  },
};
