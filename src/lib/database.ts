export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          title: string;
          description: string;
          thumbnail_url: string;
          video_url: string;
          category_id: string;
          duration: number;
          views: number;
          likes: number;
          created_by: string;
          created_at: string;
          updated_at: string;
          is_featured: boolean;
          video_type: "documentary" | "tutorial" | "news" | "interview";
          categories?: {
            id: string;
            name: string;
            description: string | null;
            icon: string;
            color: string;
            created_at: string;
          } | null;
          users?: {
            id: string;
            email: string;
            full_name: string;
            avatar_url: string | null;
          } | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          thumbnail_url: string;
          video_url: string;
          category_id: string;
          duration: number;
          views?: number;
          likes?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          is_featured?: boolean;
          video_type: "documentary" | "tutorial" | "news" | "interview";
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          thumbnail_url?: string;
          video_url?: string;
          category_id?: string;
          duration?: number;
          views?: number;
          likes?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          is_featured?: boolean;
          video_type?: "documentary" | "tutorial" | "news" | "interview";
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          content: string;
          likes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          user_id: string;
          content: string;
          likes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          user_id?: string;
          content?: string;
          likes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          created_at?: string;
        };
      };
      newsletter: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      analytics: {
        Row: {
          id: string;
          video_id: string;
          views: number;
          watch_time: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          views?: number;
          watch_time?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          views?: number;
          watch_time?: number;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      increment_views: {
        Args: {
          video_id: string;
        };
        Returns: void;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
