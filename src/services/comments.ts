import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types";

export const commentService = {
  async getVideoComments(videoId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        users:user_id (id, full_name, avatar_url)
      `
      )
      .eq("video_id", videoId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  async addComment(
    videoId: string,
    userId: string,
    content: string
  ): Promise<Comment> {
    const { data, error } = await (supabase
      .from("comments")
      .insert([
        {
          video_id: videoId,
          user_id: userId,
          content,
        },
      ] as any)
      .select(
        `
        *,
        users:user_id (id, full_name, avatar_url)
      `
      )
      .single() as any);

    if (error) throw error;
    return data;
  },

  async updateComment(id: string, content: string) {
    const { data, error } = await ((supabase.from("comments") as any)
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        users:user_id (id, full_name, avatar_url)
      `
      )
      .single() as any);

    if (error) throw error;
    return data;
  },

  async deleteComment(id: string) {
    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) throw error;
  },

  async likeComment(id: string) {
    const { data: comment, error: fetchError } = await (supabase.from("comments") as any)
      .select("likes")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await ((supabase.from("comments") as any)
      .update({
        likes: ((comment as any)?.likes || 0) + 1,
      })
      .eq("id", id) as any);

    if (error) throw error;
  },
};
