# Database Schema Documentation

## Tables Overview

### Users
Stores user account information and profiles.

**Fields:**
- `id` (UUID): Primary key
- `email` (TEXT): Unique email address
- `full_name` (TEXT): User's full name
- `avatar_url` (TEXT): URL to user's avatar
- `bio` (TEXT): User biography
- `is_admin` (BOOLEAN): Admin flag
- `created_at` (TIMESTAMP): Account creation time
- `updated_at` (TIMESTAMP): Last update time

### Videos
Stores video metadata and information.

**Fields:**
- `id` (UUID): Primary key
- `title` (TEXT): Video title
- `description` (TEXT): Video description
- `thumbnail_url` (TEXT): Thumbnail image URL
- `video_url` (TEXT): YouTube video ID or video URL
- `category_id` (UUID): Foreign key to categories table
- `duration` (INTEGER): Video duration in seconds
- `views` (INTEGER): Total view count
- `likes` (INTEGER): Total like count
- `created_by` (UUID): Foreign key to users table
- `created_at` (TIMESTAMP): Upload time
- `updated_at` (TIMESTAMP): Last update time
- `is_featured` (BOOLEAN): Featured status
- `video_type` (TEXT): Type of video (documentary, tutorial, news, interview)

### Categories
Stores video categories.

**Fields:**
- `id` (UUID): Primary key
- `name` (TEXT): Category name (unique)
- `description` (TEXT): Category description
- `icon` (TEXT): Lucide React icon name
- `color` (TEXT): Hex color code
- `created_at` (TIMESTAMP): Creation time

### Comments
Stores user comments on videos.

**Fields:**
- `id` (UUID): Primary key
- `video_id` (UUID): Foreign key to videos table
- `user_id` (UUID): Foreign key to users table
- `content` (TEXT): Comment content
- `likes` (INTEGER): Comment like count
- `created_at` (TIMESTAMP): Creation time
- `updated_at` (TIMESTAMP): Last update time

### Likes
Stores video likes (one-to-many relationship between users and videos).

**Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users table
- `video_id` (UUID): Foreign key to videos table
- `created_at` (TIMESTAMP): Creation time
- Unique constraint on (user_id, video_id)

### Newsletter
Stores newsletter subscriptions.

**Fields:**
- `id` (UUID): Primary key
- `email` (TEXT): Email address (unique)
- `created_at` (TIMESTAMP): Subscription time

## Row Level Security (RLS) Policies

- Videos: Public read, admin/owner write
- Comments: Public read, user write/delete own
- Likes: Public read, user write/delete own
- Categories: Public read, admin write
- Newsletter: Public insert

## Indexes

- `users.email` - For faster lookups
- `videos.category_id` - For category filtering
- `videos.created_by` - For user videos
- `videos.is_featured` - For featured content
- `comments.video_id` - For video comments
- `likes.video_id` - For video likes
- `likes.user_id` - For user likes

## Setup Instructions

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Copy-paste the contents of `prisma/schema.sql`
4. Execute the SQL
5. Enable Row Level Security for each table
6. Update your `.env.local` with Supabase credentials

## Default Categories

The schema automatically creates these categories:
- Documentaries (Film icon)
- Tutorials (Lightbulb icon)
- News (AlertCircle icon)
- Interviews (Mic2 icon)
- Inspirational (Heart icon)
- Technology (Zap icon)
