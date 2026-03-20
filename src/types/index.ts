export interface User {
  id: string;
  email: string;
  username?: string | null;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
}

export interface Video {
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
}

export interface VideoWithRelations extends Video {
  categories?: {
    name: string;
    icon: string;
    color: string;
  } | null;
  users?: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Like {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface Analytics {
  id: string;
  video_id: string;
  views: number;
  completion_rate: number;
  avg_watch_time: number;
  date: string;
}

export interface Newsletter {
  id: string;
  email: string;
  created_at: string;
}

export * from './premium';
