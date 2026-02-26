# Architecture & API Documentation

## Project Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│   Next.js App Router (Pages)        │
│   - Home, Video Detail, Admin       │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│     React Components (UI Layer)     │
│   - Navigation, Hero, VideoCard     │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│     Framer Motion (Animations)      │
│   - Transitions, Interactions       │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│     Custom Hooks & Services         │
│   - useAuth, videoService, etc.     │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│     Supabase Client Library         │
│   - Auth, Database, Storage         │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│     Supabase Backend Infrastructure │
│   - PostgreSQL, Auth, Storage       │
└─────────────────────────────────────┘
```

## Service Layer

### Video Service (`src/services/videos.ts`)
- `getVideos(limit, offset)` - Fetch paginated videos
- `getFeaturedVideos(limit)` - Get featured content
- `getTrendingVideos(limit)` - Get trending videos
- `getVideosByCategory(categoryId, limit, offset)` - Filter by category
- `getVideoById(id)` - Get single video
- `getRelatedVideos(categoryId, currentVideoId, limit)` - Get related videos
- `searchVideos(query, limit)` - Full-text search
- `createVideo(video)` - Upload new video (admin only)
- `updateVideo(id, updates)` - Update video (admin/owner)
- `deleteVideo(id)` - Delete video (admin)
- `incrementViews(id)` - Increment view count

### Comment Service (`src/services/comments.ts`)
- `getVideoComments(videoId, limit, offset)` - Fetch paginated comments
- `addComment(videoId, userId, content)` - Add new comment
- `updateComment(id, content)` - Update comment (owner)
- `deleteComment(id)` - Delete comment (owner/admin)
- `likeComment(id)` - Like a comment

### Category Service (`src/services/categories.ts`)
- `getCategories()` - Get all categories
- `getCategoryById(id)` - Get single category
- `createCategory(name, description, icon, color)` - Create category (admin)
- `updateCategory(id, updates)` - Update category (admin)
- `deleteCategory(id)` - Delete category (admin)

### Auth Service (`src/services/auth.ts`)
- `signUp(email, password, fullName)` - Register new user
- `signIn(email, password)` - Login user
- `signOut()` - Logout user
- `getCurrentUser()` - Get current auth user
- `getUserProfile(userId)` - Get user profile
- `updateProfile(userId, updates)` - Update profile
- `uploadAvatar(userId, file)` - Upload avatar image

## Component Structure

### Layout Components
- `Navigation` - Top navigation bar
- `Hero` - Hero section with video background
- `Footer` - Footer with links and social media

### Content Components
- `VideoCard` - Single video card (featured/normal)
- `VideoGrid` - Grid of video cards with loading
- `CategoryBrowser` - Category selection interface
- `InspirationSection` - Daily inspirational quotes
- `NewsletterSection` - Newsletter subscription form

### Admin Components
- `AdminDashboard` - Main admin dashboard
- `VideoUploadForm` - Video upload form
- `CategoryManager` - Category management
- `AnalyticsDashboard` - Analytics and statistics

### UI Components (Shadcn/Radix)
- `Button` - Reusable button with variants
- `Card` - Card wrapper with hover effects
- `Badge` - Status badge component

## Hooks

### useAuth
Manages user authentication state and session.

```typescript
const { user, loading } = useAuth();
```

### useDarkMode
Controls dark mode state (always enabled by default).

```typescript
const { isDark, toggle } = useDarkMode();
```

## Styling

### Tailwind CSS Configuration
- Custom brand colors (brand-50 to brand-950)
- Islamic colors (green, gold, teal)
- Custom animations (fade-in, slide-up, pulse-glow, gradient-shift)
- Glass morphism effect utilities
- Gradient text utility

### Dark Mode
- Enabled by default (`dark` class on HTML)
- All components styled for dark mode
- Tailwind dark mode support

## Performance Optimizations

1. **Image Optimization** - Next.js Image component for remote images
2. **Code Splitting** - Dynamic imports for admin components
3. **Lazy Loading** - Components load on viewport intersection
4. **Caching** - Supabase query caching
5. **SEO** - Next.js metadata and Open Graph
6. **Animation Performance** - GPU-accelerated Framer Motion

## Security Measures

1. **Authentication** - Supabase Auth with JWT
2. **Row Level Security** - Database-level access control
3. **Input Validation** - Form validation with Zod
4. **CORS** - API route CORS headers
5. **Environment Variables** - Sensitive data in .env.local
6. **Rate Limiting** - Optional middleware (can be added)

## SEO Features

1. **Metadata** - Dynamic title and description
2. **Open Graph Tags** - Social media sharing
3. **Sitemap** - Generated by Next.js
4. **Robots.txt** - Search engine directives
5. **Structured Data** - JSON-LD support ready
6. **Performance Metrics** - Core Web Vitals optimized
