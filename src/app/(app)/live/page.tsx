'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Flame, Radio, Play, X, Users, Image as ImageIcon, Video, Youtube, Wifi, WifiOff } from 'lucide-react';
import type { LiveStream } from '@/services/live';

interface PageBanner {
  type: 'image' | 'video';
  url: string;
  title: string;
  subtitle: string;
}

const CATEGORIES = ['Tout', 'Conférence', 'Workshop', 'Éducation', 'Podcast', 'Événement', 'Design', 'Développement', 'Sport'];

export default function LivePage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<LiveStream[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewType, setViewType] = useState<'active' | 'all' | 'featured'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [banner, setBanner] = useState<PageBanner | null>(null);
  const [activeStream, setActiveStream] = useState<(LiveStream & { youtube_id?: string; stream_url?: string; stream_type?: string }) | null>(null);

  const ITEMS_PER_PAGE = 12;

  const fetchStreams = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/live?limit=50';
      if (viewType === 'active') url += '&type=active';
      else if (viewType === 'featured') url += '&type=featured';
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      setStreams(Array.isArray(data) ? data : []);
      setCurrentPage(0);
    } catch { setStreams([]); }
    finally { setIsLoading(false); }
  }, [viewType, selectedCategory]);

  useEffect(() => { fetchStreams(); }, [fetchStreams]);

  useEffect(() => {
    fetch('/api/page-banner?page=live')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBanner(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let result = streams;
    if (searchQuery) {
      result = result.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.streamer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredStreams(result);
    setCurrentPage(0);
  }, [searchQuery, streams]);

  const paginatedStreams = filteredStreams.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredStreams.length / ITEMS_PER_PAGE);

  const getEmbedUrl = (s: any): string | null => {
    // YouTube
    const ytId = s.youtube_id;
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
    // OBS / other HLS or RTMP → can't embed directly, show link
    return s.stream_url ?? null;
  };

  const isEmbeddable = (s: any): boolean => {
    if (s.youtube_id) return true;
    const url: string = s.stream_url ?? '';
    // m3u8 can be embedded via native video, YouTube link covered above
    return url.endsWith('.m3u8');
  };

  return (
    <main className="flex-1 overflow-y-auto pb-24">
      {/* BANNER */}
      <div className="relative w-full h-[220px] overflow-hidden bg-gray-900">
        {banner?.type === 'video' ? (
          <video src={banner.url} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : banner?.type === 'image' ? (
          <img src={banner.url} alt="Live" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-rose-800 to-red-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 flex items-end gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/80 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Radio size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">{banner?.title || 'Lives'}</h1>
            <p className="text-white/80 text-sm mt-1">{banner?.subtitle || 'Regardez les streams en direct'}</p>
          </div>
        </div>
        {/* Live count badge */}
        {streams.filter(s => s.is_live).length > 0 && (
          <div className="absolute top-4 right-4">
            <motion.span
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {streams.filter(s => s.is_live).length} EN DIRECT
            </motion.span>
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 space-y-5 mt-6">
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par titre ou streamer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
          />
        </motion.div>

        {/* View filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'active', label: 'En direct', icon: Radio },
            { id: 'featured', label: 'À la une', icon: Flame },
            { id: 'all', label: 'Tous', icon: Filter },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setViewType(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                viewType === id
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const val = cat === 'Tout' ? '' : cat;
            return (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCategory(val)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === val ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >{cat}</motion.button>
            );
          })}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full" />
          </div>
        )}

        {/* Stream grid */}
        {!isLoading && paginatedStreams.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedStreams.map((stream) => {
                const s = stream as any;
                const ytId = s.youtube_id;
                const thumb = ytId
                  ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
                  : stream.image;
                return (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                    onClick={() => setActiveStream(s)}
                  >
                    <div className="relative overflow-hidden aspect-video bg-gray-200 dark:bg-gray-700">
                      <img src={thumb} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <Play size={20} className="text-white ml-1" />
                        </div>
                      </div>
                      {/* LIVE badge */}
                      {stream.is_live ? (
                        <motion.div
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          LIVE
                        </motion.div>
                      ) : (
                        <span className="absolute top-2 left-2 bg-gray-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <WifiOff size={9} /> Hors ligne
                        </span>
                      )}
                      {/* Stream type badge */}
                      {ytId && (
                        <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Youtube size={9} className="text-red-400" /> YT
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug">{stream.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stream.streamer}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full">{stream.category}</span>
                        {stream.is_live && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1"><Users size={10} /> {((stream.viewers ?? 0) / 1000).toFixed(1)}K</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pb-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-4 py-2 rounded-lg bg-red-500 text-white disabled:opacity-40 text-sm">
                  Précédent
                </motion.button>
                <span className="text-sm text-gray-500">{currentPage + 1} / {totalPages}</span>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1} className="px-4 py-2 rounded-lg bg-red-500 text-white disabled:opacity-40 text-sm">
                  Suivant
                </motion.button>
              </div>
            )}
          </>
        )}

        {!isLoading && paginatedStreams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Radio size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Aucun stream trouvé</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Revenez plus tard pour du contenu en direct</p>
          </div>
        )}
      </div>

      {/* ── Stream Player Modal ── */}
      <AnimatePresence>
        {activeStream && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setActiveStream(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video bg-gray-900">
                {activeStream.youtube_id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activeStream.youtube_id}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : activeStream.stream_url?.endsWith('.m3u8') ? (
                  <video
                    src={activeStream.stream_url}
                    autoPlay
                    controls
                    className="w-full h-full"
                  />
                ) : (
                  /* OBS / RTMP — can't embed, show link */
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <Radio size={48} className="text-red-400" />
                    <p className="text-white font-semibold text-lg">{activeStream.title}</p>
                    <p className="text-gray-400 text-sm">Ce stream ne peut pas être intégré directement.</p>
                    {activeStream.stream_url && (
                      <a
                        href={activeStream.stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all"
                        onClick={e => e.stopPropagation()}
                      >
                        <Wifi size={16} /> Ouvrir le flux
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold">{activeStream.title}</h3>
                      {activeStream.is_live && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-0.5">{activeStream.streamer}</p>
                    {activeStream.is_live && activeStream.viewers > 0 && (
                      <p className="text-gray-500 text-xs mt-1 flex items-center gap-1"><Users size={11} /> {activeStream.viewers.toLocaleString()} spectateurs</p>
                    )}
                  </div>
                  <button onClick={() => setActiveStream(null)} className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">
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
