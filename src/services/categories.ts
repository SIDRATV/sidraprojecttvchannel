import { supabase } from "@/lib/supabase";

export const categoryService = {
  async getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
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
