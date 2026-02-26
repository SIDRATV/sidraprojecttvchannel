# Deployment Guide

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Supabase](https://supabase.com) account
- [Vercel](https://vercel.com) account (for deployment)
- [Git](https://git-scm.com/) for version control

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sidra-project-tv-channel.git
cd sidra-project-tv-channel
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
cp .env.local.example .env.local
```

### 4. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** to get your credentials
3. Copy `Project URL` and `anon key` to `.env.local`
4. Get `Service Role Key` from the same page
5. Update `.env.local` with these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_ENV=development
```

### 5. Initialize Database

1. Go to Supabase SQL Editor
2. Create a new query
3. Paste the contents of `prisma/schema.sql`
4. Execute the query
5. Set up storage buckets:
   - Create bucket: `videos`
   - Create bucket: `thumbnails`
   - Create bucket: `avatars`
   - Set bucket policies for public access

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Production Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com/dashboard)
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Select the project and click "Import"
5. Add environment variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click "Deploy"

**Option B: Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Configure Domain (Optional)

1. Go to Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records according to Vercel's instructions

## Database Backup & Migration

### Backup

```bash
# Export database
pg_dump -h your-supabase-db-host -U postgres your-database > backup.sql
```

### Restore

```bash
# Import database
psql -h your-supabase-db-host -U postgres your-database < backup.sql
```

## Environment Variables

### Development

```env
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Production

```env
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

## Vercel Specific Configuration

### Build Settings

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Environment & Logs

- Enable **Build and Runtime logs** for debugging
- Set **Node.js Version** to 18.x or higher

## Performance Optimization

### Images

Images are automatically optimized by Next.js:
- WebP format conversion
- Responsive image sizing
- Lazy loading

### Code

```bash
# Build analysis
npm run build -- --analyze

# Check bundle size
npm run build
```

## Monitoring & Debugging

### Vercel Analytics

1. Go to Vercel project dashboard
2. Enable **Web Analytics**
3. Monitor performance metrics

### Supabase Monitoring

1. Go to Supabase project
2. Check **Database Performance**
3. Review **API Usage**
4. Monitor **Storage Usage**

## Common Issues & Solutions

### Issue: "Module not found"

**Solution**: Clear cache and reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: "Supabase connection error"

**Solution**: Verify environment variables
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
# Should output your Supabase URL
```

### Issue: "Build fails on Vercel"

**Solution**: 
1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Run `npm run build` locally to debug

## Updates & Maintenance

### Update Dependencies

```bash
npm update
npm outdated  # Check for new versions
```

### Database Migrations

1. Make changes to `prisma/schema.sql`
2. Execute new migrations in Supabase SQL Editor
3. Test thoroughly before pushing to production

## Rollback Procedure

If deployment has issues:

1. Go to Vercel dashboard
2. Click on "Deployments"
3. Select previous working deployment
4. Click "..." > "Promote to Production"

## Support & Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
