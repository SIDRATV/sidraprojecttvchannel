'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, TrendingUp, Clock, Youtube, Play, X, Mic2, Star, Eye, Heart, ThumbsUp } from 'lucide-react';
import type { Podcast } from '@/services/podcasts';

interface YTStats { id: string; viewCount: number; likeCount: number; }

interface PageBanner {
  type: 'image' | 'video';
  url: string;
  title: string;
  subtitle: string;
}

const DISPLAY_CATEGORIES = ['Technologie', 'Business', 'IA & ML', 'D\u00e9veloppement', 'Marketing', 'Design', 'Soci\u00e9t\u00e9', 'Sport'];

export default function PodcastPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewType, setViewType] = useState<'all' | 'trending' | 'recent'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [banner, setBanner] = useState<PageBanner | null>(null);
  const [activeVideo, setActiveVideo] = useState<(Podcast & { youtube_id?: string }) | null>(null);
  const [ytStats, setYtStats] = useState<Record<string, YTStats>>({});

  // Formats number: 1200 → "1.2K", 1500000 → "1.5M", 800 → "800"
  const fmtNum = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  };

  const ITEMS_PER_PAGE = 12;

  const fetchPodcasts = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/podcasts?limit=50';
      if (viewType === 'trending') url += '&type=trending';
      else if (viewType === 'recent') url += '&type=featured';
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      setPodcasts(Array.isArray(data) ? data : []);
      setCurrentPage(0);
    } catch { setPodcasts([]); }
    finally { setIsLoading(false); }
  }, [viewType, selectedCategory]);

  useEffect(() => { fetchPodcasts(); }, [fetchPodcasts]);

  // Fetch YouTube stats when podcasts change
  useEffect(() => {
    const ids = podcasts
      .map(p => (p as any).youtube_id as string | undefined)
      .filter((id): id is string => !!id)
      .slice(0, 50);
    if (ids.length === 0) return;
    fetch(`/api/youtube-stats?ids=${ids.join(',')}`)
      .then(r => r.ok ? r.json() : [])
      .then((stats: YTStats[]) => {
        const map: Record<string, YTStats> = {};
        stats.forEach(s => { map[s.id] = s; });
        setYtStats(map);
      })
      .catch(() => {});
  }, [podcasts]);

  useEffect(() => {
    fetch('/api/page-banner?page=podcast')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBanner(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let result = podcasts;
    if (searchQuery) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.creator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPodcasts(result);
    setCurrentPage(0);
  }, [searchQuery, podcasts]);

  const paginatedPodcasts = filteredPodcasts.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredPodcasts.length / ITEMS_PER_PAGE);

  const getYtId = (p: Podcast & { youtube_id?: string }): string | null => {
    if ((p as any).youtube_id) return (p as any).youtube_id;
    const m = p.image?.match(/img\.youtube\.com\/vi\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  return (
    <main className="flex-1 overflow-y-auto pb-24">
      {/* BANNER */}
      <div className="relative w-full h-[220px] overflow-hidden bg-gray-900">
        {banner?.type === 'video' ? (
          <video src={banner.url} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : banner?.type === 'image' ? (
          <img src={banner.url} alt="Podcasts" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 flex items-end gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/80 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Mic2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">{banner?.title || 'Podcasts'}</h1>
            <p className="text-white/80 text-sm mt-1">{banner?.subtitle || 'D\u00e9couvrez nos derniers \u00e9pisodes et s\u00e9ries'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-5 mt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par titre ou cr\u00e9ateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </motion.div>

        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Tous', icon: Filter },
            { id: 'recent', label: 'R\u00e9cents', icon: Clock },
            { id: 'trending', label: 'Tendances', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setViewType(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                viewType === id
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {['', ...DISPLAY_CATEGORIES].map((cat) => (
            <motion.button
              key={cat || '__all__'}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >{cat || 'Toutes'}</motion.button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full" />
          </div>
        )}

        {!isLoading && paginatedPodcasts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedPodcasts.map((podcast) => {
                const ytId = getYtId(podcast as any);
                const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : podcast.image;
                return (
                  <motion.div
                    key={podcast.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                    onClick={() => ytId && setActiveVideo({ ...podcast, youtube_id: ytId })}
                  >
                    <div className="relative overflow-hidden aspect-video bg-gray-200 dark:bg-gray-700">
                      <img src={thumb} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center shadow-lg">
                          {ytId ? <Youtube size={22} className="text-white" /> : <Play size={20} className="text-white ml-1" />}
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        {ytId && (
                          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Youtube size={10} /> YT
                          </span>
                        )}
                        {(podcast as any).is_featured && (
                          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star size={10} /> Featured
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug">{podcast.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{podcast.creator}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 px-2 py-0.5 rounded-full">{podcast.category}</span>
                        <span className="text-[11px] text-gray-400">{podcast.duration}</span>
                      </div>
                      {(() => {
                        const ytId = (podcast as any).youtube_id as string | undefined;
                        const yt = ytId ? ytStats[ytId] : null;
                        const views = yt ? yt.viewCount : (podcast.views ?? 0);
                        const likes = yt ? yt.likeCount : (podcast.likes ?? 0);
                        return (
                          <div className="flex gap-3 text-[11px] text-gray-400 pt-1">
                            <span className="flex items-center gap-1 font-medium">
                              <Eye size={11} className="text-blue-400" />
                              {fmtNum(views)}
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <ThumbsUp size={11} className="text-rose-400" />
                              {fmtNum(likes)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pb-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-4 py-2 rounded-lg bg-brand-500 text-white disabled:opacity-40 text-sm">
                  Pr\u00e9c\u00e9dent
                </motion.button>
                <span className="text-sm text-gray-500">{currentPage + 1} / {totalPages}</span>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1} className="px-4 py-2 rounded-lg bg-brand-500 text-white disabled:opacity-40 text-sm">
                  Suivant
                </motion.button>
              </div>
            )}
          </>
        )}

        {!isLoading && paginatedPodcasts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mic2 size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Aucun podcast trouv\u00e9</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Ajustez vos filtres ou revenez plus tard</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?autoplay=1&rel=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 bg-gray-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-white font-semibold">{activeVideo.title}</h3>
                    <p className="text-gray-400 text-sm mt-0.5">{activeVideo.creator}</p>
                  </div>
                  <button onClick={() => setActiveVideo(null)} className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">
                    <X size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
