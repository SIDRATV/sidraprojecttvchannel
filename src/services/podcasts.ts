import { supabase } from "@/lib/supabase";

export interface Podcast {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: string;
  category: string;
  creator: string;
  views: number;
  likes: number;
  created_at: string;
  is_featured?: boolean;
}

export const podcastService = {
  async getPodcasts(limit = 12, offset = 0, category?: string) {
    try {
      let query = supabase
        .from("podcasts")
        .select("*")
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) throw error;
      return (data as Podcast[]) || [];
    } catch (error) {
      console.debug("Podcasts service unavailable - demo mode");
      return [];
    }
  },

  async getFeaturedPodcasts(limit = 6) {
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Podcast[]) || [];
    } catch (error) {
      console.debug("Featured podcasts unavailable - demo mode");
      return [];
    }
  },

  async getTrendingPodcasts(limit = 12) {
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("views", { ascending: false })
        .order("likes", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Podcast[]) || [];
    } catch (error) {
      console.debug("Trending podcasts unavailable - demo mode");
      return [];
    }
  },

  async getPodcastsByCategory(category: string, limit = 12, offset = 0) {
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("category", category)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return (data as Podcast[]) || [];
    } catch (error) {
      console.debug("Category podcasts unavailable - demo mode");
      return [];
    }
  },

  async searchPodcasts(query: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("views", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Podcast[]) || [];
    } catch (error) {
      console.debug("Search unavailable - demo mode");
      return [];
    }
  },

  async getPodcastById(id: string) {
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Podcast;
    } catch (error) {
      console.debug("Podcast unavailable - demo mode");
      return null;
    }
  },

  async incrementViews(id: string) {
    try {
      const podcast = await this.getPodcastById(id);
      if (!podcast) return null;

      const { data, error } = await (supabase
        .from("podcasts") as any)
        .update({ views: (podcast.views || 0) + 1 })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug("Increment views unavailable - demo mode");
      return null;
    }
  },

  async likePodcast(id: string) {
    try {
      const podcast = await this.getPodcastById(id);
      if (!podcast) return null;

      const { data, error } = await (supabase
        .from("podcasts") as any)
        .update({ likes: (podcast.likes || 0) + 1 })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug("Like podcast unavailable - demo mode");
      return null;
    }
  },
};
