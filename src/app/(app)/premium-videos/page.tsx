'use client';

import { motion } from 'framer-motion';
import { useState, useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Film, Search, Sparkles, Crown, ChevronRight } from 'lucide-react';
import { PremiumVideoCard } from '@/components/premium/PremiumVideoCard';
import { premiumVideoService } from '@/services/premiumVideos';
import { categoryService } from '@/services/categories';
import { useAuth } from '@/hooks/useAuth';
import type { PremiumVideoWithRelations } from '@/types/premium';
import Link from 'next/link';

// Visual config for known categories (emoji + preferred order)
const CATEGORY_CONFIG: Record<string, { emoji: string; order: number }> = {
  'films':         { emoji: '🎬', order: 1 },
  'séries':        { emoji: '📺', order: 2 },
  'series':        { emoji: '📺', order: 2 },
  'sport':         { emoji: '⚽', order: 3 },
  'anime':         { emoji: '⭐', order: 4 },
  'documentaires': { emoji: '🎥', order: 5 },
  'documentary':   { emoji: '🎥', order: 5 },
  'enfants':       { emoji: '🧒', order: 6 },
  'masterclasses': { emoji: '🎓', order: 7 },
  'innovation':    { emoji: '💡', order: 8 },
  'news':          { emoji: '📰', order: 9 },
  'podcasts':      { emoji: '🎙️', order: 10 },
  'inspiration':   { emoji: '❤️', order: 11 },
  'trending':      { emoji: '⚡', order: 12 },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-2 flex-shrink-0 w-44 sm:w-52">
      <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-2.5 w-16 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-3.5 w-full rounded bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

function CategoryRow({
  label,
  emoji,
  slug,
  videos,
  isPremiumUser,
}: {
  label: string;
  emoji: string;
  slug: string;
  videos: PremiumVideoWithRelations[];
  isPremiumUser: boolean;
}) {
  if (videos.length === 0) return null;
  return (
    <motion.section variants={fadeUp} className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>{emoji}</span>
          {label}
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">
            {videos.length} titres
          </span>
        </h2>
        <Link
          href={`/premium-videos?category=${slug}`}
          className="flex items-center gap-0.5 text-xs font-semibold text-gold-500 hover:text-gold-400 transition-colors"
        >
          Voir tout <ChevronRight size={14} />
        </Link>
      </div>
      <div className="-mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {videos.map((video) => (
            <div key={video.id} className="flex-shrink-0 w-44 sm:w-52">
              <PremiumVideoCard video={video} isPremiumUser={isPremiumUser} compact />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function PremiumVideosContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') ?? null;

  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  const isPremiumUser = !!(
    user &&
    user.premium_plan &&
    (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date())
  );

  const { data: allVideos = [], isLoading } = useQuery<PremiumVideoWithRelations[]>({
    queryKey: ['premium-videos-all'],
    queryFn: () => premiumVideoService.getVideos(200, 0),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Load DB categories with long cache — used to build dynamic category tabs
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const sorted = useMemo(
    () =>
      [...allVideos].sort((a, b) => {
        const ao = (a as any).sort_order ?? 999999;
        const bo = (b as any).sort_order ?? 999999;
        if (ao !== bo) return ao - bo;
        return new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime();
      }),
    [allVideos],
  );

  // Build category list from DB — only categories that actually have videos
  const activeCategories = useMemo(() => {
    const cats = dbCategories.map((cat) => {
      const key = cat.name.toLowerCase();
      const config = CATEGORY_CONFIG[key] ?? { emoji: '📹', order: 99 };
      const videos = sorted.filter(
        (v) => v.categories?.name?.toLowerCase() === key,
      );
      return {
        slug: key.replace(/\s+/g, '-'),
        label: cat.name,
        emoji: config.emoji,
        order: config.order,
        videos,
      };
    }).filter((c) => c.videos.length > 0);

    // Also include any video categories not covered by DB (orphaned data)
    const coveredKeys = new Set(cats.map((c) => c.label.toLowerCase()));
    const orphanMap: Record<string, PremiumVideoWithRelations[]> = {};
    for (const v of sorted) {
      const name = v.categories?.name;
      if (name && !coveredKeys.has(name.toLowerCase())) {
        if (!orphanMap[name]) orphanMap[name] = [];
        orphanMap[name].push(v);
      }
    }
    const orphans = Object.entries(orphanMap).map(([name, videos]) => ({
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      label: name,
      emoji: '📹',
      order: 99,
      videos,
    }));

    return [...cats, ...orphans].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  }, [dbCategories, sorted]);

  // Videos for the selected category tab or search
  const filteredVideos = useMemo(() => {
    let base: PremiumVideoWithRelations[];
    if (selectedSlug) {
      const cat = activeCategories.find((c) => c.slug === selectedSlug);
      base = cat ? cat.videos : sorted;
    } else {
      base = sorted;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return base;
  }, [selectedSlug, activeCategories, sorted, searchQuery]);

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 transition-colors overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gold-500/5 dark:bg-gold-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[400px] w-[400px] rounded-full bg-brand-500/5 dark:bg-brand-500/8 blur-3xl" />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 p-4 md:p-8 lg:p-10 space-y-6"
      >
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold-500 to-gold-400 shadow-lg shadow-gold-500/20">
              <Film size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold-400 via-gold-500 to-gold-300 bg-clip-text text-transparent">
                Premium Videos
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Contenu exclusif pour abonnés premium
              </p>
            </div>
          </div>
          {!isPremiumUser && (
            <Link href="/premium">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 cursor-pointer hover:border-gold-500/40 transition-all"
              >
                <Crown size={18} className="text-gold-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gold-600 dark:text-gold-400">Débloquer Premium</span>
                  {' '}— Abonnez-vous pour regarder tout le contenu exclusif
                </p>
                <Sparkles size={14} className="text-gold-400 ml-auto" />
              </motion.div>
            </Link>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des vidéos premium…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm"
          />
        </motion.div>

        <motion.div variants={fadeUp} className="-mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedSlug(null)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                !selectedSlug
                  ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/30'
                  : 'bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              ✨ Tout
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedSlug(cat.slug)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedSlug === cat.slug
                    ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/30'
                    : 'bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <motion.div variants={fadeUp} className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <SkeletonCard key={j} />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : !selectedSlug && !searchQuery ? (
          <motion.div variants={stagger} className="space-y-8">
            {activeCategories.map((cat) => (
              <CategoryRow
                key={cat.slug}
                label={cat.label}
                emoji={cat.emoji}
                slug={cat.slug}
                videos={cat.videos}
                isPremiumUser={isPremiumUser}
              />
            ))}
            {sorted.length === 0 && (
              <motion.div variants={fadeUp} className="text-center py-20">
                <Film size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                  Aucune vidéo premium
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  Nouveau contenu bientôt disponible
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : filteredVideos.length === 0 ? (
          <motion.div variants={fadeUp} className="text-center py-20">
            <Film size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              Aucune vidéo trouvée
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {searchQuery ? 'Essayez un autre terme' : 'Nouveau contenu bientôt disponible'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {filteredVideos.map((video) => (
              <motion.div key={video.id} variants={fadeUp}>
                <PremiumVideoCard video={video} isPremiumUser={isPremiumUser} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function PremiumVideosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold-500 border-t-transparent" />
      </div>
    }>
      <PremiumVideosContent />
    </Suspense>
  );
}
