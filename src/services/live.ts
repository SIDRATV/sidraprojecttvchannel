import { supabase } from "@/lib/supabase";

export interface LiveStream {
  id: string;
  title: string;
  description: string;
  image: string;
  viewers: number;
  category: string;
  streamer: string;
  is_live: boolean;
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
}

export const liveService = {
  async getLiveStreams(limit = 12, offset = 0, category?: string) {
    try {
      let query = supabase
        .from("live_streams")
        .select("*")
        .order("updated_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) throw error;
      return (data as LiveStream[]) || [];
    } catch (error) {
      console.debug("Live streams service unavailable - demo mode");
      return [];
    }
  },

  async getActiveLiveStreams(limit = 12) {
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .eq("is_live", true)
        .order("viewers", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as LiveStream[]) || [];
    } catch (error) {
      console.debug("Active live streams unavailable - demo mode");
      return [];
    }
  },

  async getFeaturedLiveStreams(limit = 6) {
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .eq("is_featured", true)
        .eq("is_live", true)
        .order("viewers", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as LiveStream[]) || [];
    } catch (error) {
      console.debug("Featured live streams unavailable - demo mode");
      return [];
    }
  },

  async getLiveStreamsByCategory(category: string, limit = 12, offset = 0) {
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .eq("category", category)
        .order("viewers", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return (data as LiveStream[]) || [];
    } catch (error) {
      console.debug("Category live streams unavailable - demo mode");
      return [];
    }
  },

  async searchLiveStreams(query: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("viewers", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as LiveStream[]) || [];
    } catch (error) {
      console.debug("Search unavailable - demo mode");
      return [];
    }
  },

  async getLiveStreamById(id: string) {
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as LiveStream;
    } catch (error) {
      console.debug("Live stream unavailable - demo mode");
      return null;
    }
  },

  async updateViewers(id: string, viewers: number) {
    try {
      const { data, error } = await (supabase
        .from("live_streams") as any)
        .update({ viewers, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug("Update viewers unavailable - demo mode");
      return null;
    }
  },
};
