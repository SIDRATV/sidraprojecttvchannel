import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

// Default categories for fallback
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Documentary', description: 'Inspiring Islamic documentaries', icon: 'Film', color: '#3b82f6', created_at: new Date().toISOString() },
  { id: '2', name: 'Innovation', description: 'Tech and innovation projects', icon: 'Lightbulb', color: '#f59e0b', created_at: new Date().toISOString() },
  { id: '3', name: 'News', description: 'Latest Islamic news and updates', icon: 'AlertCircle', color: '#ef4444', created_at: new Date().toISOString() },
  { id: '4', name: 'Podcasts', description: 'Audio discussions and talks', icon: 'Mic2', color: '#8b5cf6', created_at: new Date().toISOString() },
  { id: '5', name: 'Inspiration', description: 'Inspiring stories and content', icon: 'Heart', color: '#ec4899', created_at: new Date().toISOString() },
  { id: '6', name: 'Trending', description: 'What\'s trending now', icon: 'Zap', color: '#10b981', created_at: new Date().toISOString() },
];

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error('Supabase error fetching categories:', error.message);
        return DEFAULT_CATEGORIES;
      }

      // If no data, return default categories
      if (!data || data.length === 0) {
        console.warn('No categories found in database, using defaults');
        return DEFAULT_CATEGORIES;
      }

      return data as Category[];
    } catch (err) {
      console.error('Exception fetching categories:', err);
      return DEFAULT_CATEGORIES;
    }
  },

  async getCategoryById(id: string) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createCategory(name: string, description: string, icon: string, color: string) {
    const { data, error } = await (supabase
      .from("categories")
      .insert([{ name, description, icon, color }] as any)
      .select()
      .single() as any);

    if (error) throw error;
    return data;
  },

  async updateCategory(
    id: string,
    updates: { name?: string; description?: string; icon?: string; color?: string }
  ) {
    const { data, error } = await ((supabase.from("categories") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single() as any);

    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) throw error;
  },
};
