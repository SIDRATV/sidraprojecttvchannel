import { supabase } from "@/lib/supabase";
import type { Video, VideoWithRelations } from "@/types";

export const videoService = {
  async getVideos(limit = 12, offset = 0) {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(
          `
          *,
          categories:category_id (name, icon, color),
          users:created_by (full_name, avatar_url)
        `
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data as VideoWithRelations[];
    } catch (error) {
      console.debug("Videos service unavailable - demo mode");
      return [];
    }
  },

  async getFeaturedVideos(limit = 5) {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(
          `
          *,
          categories:category_id (name, icon, color),
          users:created_by (full_name, avatar_url)
        `
        )
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as VideoWithRelations[];
    } catch (error) {
      console.debug("Featured videos unavailable - demo mode");
      return [];
    }
  },

  async getTrendingVideos(limit = 12) {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(
          `
          *,
          categories:category_id (name, icon, color),
          users:created_by (full_name, avatar_url)
        `
        )
        .order("views", { ascending: false })
        .order("likes", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as VideoWithRelations[];
    } catch (error) {
      console.debug("Trending videos unavailable - demo mode");
      return [];
    }
  },

  async getVideosByCategory(categoryId: string, limit = 12, offset = 0) {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(
          `
          *,
          categories:category_id (name, icon, color),
          users:created_by (full_name, avatar_url)
        `
        )
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data as VideoWithRelations[];
    } catch (error) {
      console.debug("Category videos unavailable - demo mode");
      return [];
    }
  },

  async getVideoById(id: string) {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(
          `
          *,
          categories:category_id (name, icon, color),
          users:created_by (full_name, avatar_url)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as VideoWithRelations;
    } catch (error) {
      console.debug("Video unavailable - demo mode");
      return null as any;
    }
  },

  async getRelatedVideos(categoryId: string, currentVideoId: string, limit = 6) {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(
          `
          *,
          categories:category_id (name, icon, color),
          users:created_by (full_name, avatar_url)
        `
        )
        .eq("category_id", categoryId)
        .neq("id", currentVideoId)
        .order("views", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as VideoWithRelations[];
    } catch (error) {
      console.debug("Related videos unavailable - demo mode");
      return [];
    }
  },

  async searchVideos(query: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(
          `
          *,
          categories:category_id (name, icon, color),
          users:created_by (full_name, avatar_url)
        `
        )
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("views", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as VideoWithRelations[];
    } catch (error) {
      console.debug("Search unavailable - demo mode");
      return [];
    }
  },

  async createVideo(video: Omit<Video, "id" | "created_at" | "updated_at">) {
    try {
      const { data, error } = await (supabase
        .from("videos")
        .insert([video] as any)
        .select()
        .single() as any);

      if (error) throw error;
      return data as Video;
    } catch (error) {
      console.debug("Create video unavailable - demo mode");
      return null as any;
    }
  },

  async updateVideo(id: string, updates: Partial<Video>) {
    try {
      const { data, error } = await (supabase.from("videos") as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Video;
    } catch (error) {
      console.debug("Update video unavailable - demo mode");
      return null as any;
    }
  },

  async deleteVideo(id: string) {
    try {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.debug("Delete video unavailable - demo mode");
    }
  },

  async incrementViews(id: string) {
    try {
      const { data, error } = await (supabase.rpc("increment_views", {
        video_id: id,
      } as any) as any);

      if (error) throw error;
      return data;
    } catch (error) {
      console.debug("Increment views unavailable - demo mode");
      return null;
    }
  },
};
