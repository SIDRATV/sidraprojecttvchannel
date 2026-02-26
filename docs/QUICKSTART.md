# Quick Start Guide

## Installation (5 minutes)

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Vercel account (optional, for deployment)

### 2. Clone & Install

```bash
git clone <repo-url>
cd sidra-project-tv-channel
npm install
```

### 3. Setup Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Copy your credentials
3. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

4. Run database setup:
   - Go to Supabase SQL Editor
   - Copy-paste `prisma/schema.sql`
   - Execute

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 ✨

## Key Features

### 🎬 Video Streaming
- Embedded YouTube player
- Auto-playing hero video
- Smooth transitions and animations

### 👤 User Authentication
- Sign up and login
- Profile management
- Admin dashboard access

### 💬 Comments System
- Real-time comments
- Comment likes
- User interactions

### 📊 Admin Dashboard
- Upload videos
- Manage categories
- View analytics

### 🎨 Design
- Dark mode by default
- Responsive mobile-first
- Framer Motion animations
- Glass-morphism effects

## Project Structure

```
src/
├── app/              # Next.js pages and routes
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and Supabase client
├── services/        # API service layer
└── types/           # TypeScript type definitions

docs/               # Documentation
public/             # Static assets
prisma/             # Database schema
```

## Building Your Content

### Add Videos

1. Go to `/admin` (requires admin account)
2. Click "Upload Video"
3. Fill in video details
4. Submit

**Note**: You need an admin account. Update your user in Supabase:

```sql
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

### Add Categories

Edit `prisma/schema.sql` to add more default categories, or use the admin dashboard.

## Customization

### Colors
Edit `tailwind.config.ts` to customize brand colors:

```typescript
brand: {
  500: '#5b63f5',  // Your brand color
}
```

### Logo
Replace emoji in components with your logo:

```typescript
<span className="text-2xl">📺</span>  // Change this
```

### Fonts
Edit `src/app/layout.tsx` to change fonts:

```typescript
import { Poppins } from 'next/font/google';
const font = Poppins({ weight: '400' });
```

## Deployment

### Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel --prod
```

Or use the [Vercel Dashboard](https://vercel.com/dashboard)

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start               # Start prod server
npm run lint            # Run linter
npm run type-check      # Check TypeScript

# Database
npm run db:push         # Push schema to DB
npm run db:studio       # Open Supabase studio
```

## Testing

### Test Authentication
1. Go to `/signup` and create account
2. Go to `/login` and sign in
3. Visit `/admin` to confirm access

### Test Video Upload
1. Login as admin
2. Go to `/admin` > Upload Video
3. Fill form and submit

### Test Comments
1. Go to any video
2. Login if needed
3. Add comment

## Troubleshooting

### Videos not loading?
- Check Supabase connection in console
- Verify YouTube video IDs are correct
- Check CORS settings

### Admin dashboard not accessible?
- Verify your account has `is_admin = true`
- Check user is logged in
- Clear browser cache

### Styles not loading?
- Run `npm run build`
- Clear `.next` folder: `rm -rf .next`
- Restart dev server

## Next Steps

1. **Customize branding** - Update colors, fonts, logo
2. **Add your content** - Upload videos and categories
3. **Configure analytics** - Connect Google Analytics
4. **Setup email** - Add SendGrid for notifications
5. **Deploy** - Push to Vercel

## Support

- 📚 Check [docs](/docs) folder
- 🐛 Report issues on GitHub
- 💬 Join our community Discord

## License

MIT - See LICENSE file

## Made with ❤️

Built for the Islamic tech community by the Sidra team.
