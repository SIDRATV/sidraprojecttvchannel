import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Create a mock client if credentials are not configured
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side client (for API routes)
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return createClient(supabaseUrl, supabaseServiceKey);
};
