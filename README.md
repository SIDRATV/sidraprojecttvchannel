# 🎬 Sidra Project TV Channel

A premium Islamic media streaming platform showcasing innovative projects within the Sidra ecosystem. Built with cutting-edge technology and designed with Netflix minimalism meets Apple elegance.

## 🎯 Features

- **Premium Video Streaming**: High-quality video playback with adaptive bitrate
- **User Authentication**: Secure auth with Supabase
- **Interactive Comments**: Engage with community on videos
- **Admin Dashboard**: Comprehensive content management
- **Dark Mode**: Modern dark interface by default
- **Responsive Design**: Mobile-first approach
- **SEO Optimized**: Built-in SEO features
- **Real-time Updates**: Live features with Supabase
- **Smooth Animations**: Framer Motion animations throughout

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Vercel-optimized

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd sidra-project-tv-channel
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase credentials in `.env.local`

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL migrations (see Database Setup section)
   - Configure authentication providers

5. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Visit http://localhost:3000

## 🗄️ Database Setup

See `docs/DATABASE.md` for full schema and setup instructions.

**Quick Start:**
1. Go to your Supabase dashboard
2. Open SQL Editor
3. Run the SQL schema from `prisma/schema.sql`
4. Enable Row Level Security (RLS)

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes group
│   │   ├── login/           # Login page
│   │   └── signup/          # Signup page
│   ├── (main)/              # Main routes group
│   │   ├── page.tsx         # Homepage
│   │   └── layout.tsx       # Main layout
│   ├── video/               # Video detail pages
│   ├── admin/               # Admin dashboard
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Shadcn UI components
│   ├── Hero.tsx            # Hero section
│   ├── VideoCard.tsx       # Video card component
│   ├── Navigation.tsx      # Navigation bar
│   └── ...                 # Other components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and helpers
│   ├── supabase.ts         # Supabase client
│   └── utils.ts            # Helper functions
├── services/               # API services
│   ├── videos.ts          # Video service
│   ├── auth.ts            # Auth service
│   └── comments.ts        # Comments service
├── types/                  # TypeScript types
└── utils/                  # Utility functions
```

## 🎨 Design System

### Colors
- **Brand Blue**: #5b63f5
- **Islamic Green**: #16a34a
- **Islamic Gold**: #f59e0b
- **Teal**: #14b8a6

### Typography
- **Font**: Inter (system default fallback)
- **Dark mode**: Default theme

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
vercel
```

## 📚 Documentation

- [Database Schema](./docs/DATABASE.md)
- [API Routes](./docs/API.md)
- [Components Guide](./docs/COMPONENTS.md)
- [Authentication Setup](./docs/AUTH.md)

## 🔐 Security

- Row Level Security (RLS) on all tables
- Secure authentication with Supabase
- CSRF protection
- Sanitized user inputs
- Rate limiting (optional)

## 🎬 Features Roadmap

- [ ] Live streaming support
- [ ] Advanced recommendation engine
- [ ] Social sharing
- [ ] Playlist creation
- [ ] Watch history
- [ ] Personal recommendations
- [ ] Premium subscriptions
- [ ] Advanced analytics

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

We welcome contributions! Please see CONTRIBUTING.md for guidelines.

## 📧 Contact

For questions or feedback, contact: support@sidraproject.com

---

**Made with ❤️ for the Islamic tech community**
