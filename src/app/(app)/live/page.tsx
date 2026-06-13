'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Flame, Radio, Play, X, Users, Image as ImageIcon, Globe } from 'lucide-react';
import type { LiveStream } from '@/services/live';
import { useLiveStreams } from '@/hooks/queries/useLiveStreams';
import { useIPTVChannels, type IPTVChannel } from '@/hooks/useIPTVChannels';
import { HLSVideoPlayer } from '@/components/HLSVideoPlayer';

interface YTStats { id: string; viewCount: number; likeCount: number; concurrentViewers?: number; }

interface PageBanner {
  type: 'image' | 'video';
  url: string;
  title: string;
  subtitle: string;
}

const CATEGORIES = ['Tout', 'Conférence', 'Workshop', 'Éducation', 'Podcast', 'Événement', 'Design', 'Développement', 'Sport'];
const COUNTRIES = ['FR', 'US', 'GB', 'DE', 'ES', 'IT', 'PT', 'NL', 'BE', 'CH'];

export default function LivePage() {
  const [filteredStreams, setFilteredStreams] = useState<LiveStream[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewType, setViewType] = useState<'active' | 'all' | 'featured'>('active');
  const [currentPage, setCurrentPage] = useState(0);
  const [banner, setBanner] = useState<PageBanner | null>(null);
  const [activeStream, setActiveStream] = useState<(LiveStream & { youtube_id?: string; stream_url?: string; stream_type?: string }) | null>(null);
  const [ytViewers, setYtViewers] = useState<Record<string, number | undefined>>({});
  const refreshTimerRef = useRef<ReturnType<typeof setInterval>>();

  // IPTV Channels
  const [selectedCountry, setSelectedCountry] = useState<string>('FR');
  const [showIPTV, setShowIPTV] = useState(false);
  const [activeIPTVChannel, setActiveIPTVChannel] = useState<IPTVChannel | null>(null);
  const { channels: iptvChannels, loading: iptvLoading } = useIPTVChannels(selectedCountry);

  // Fetch streams via React Query
  const { streams, isLoading } = useLiveStreams({ viewType, category: selectedCategory });

  const livePlayerRef = useRef<HTMLDivElement>(null);
  const [isLiveFullscreen, setIsLiveFullscreen] = useState(false);
  useEffect(() => {
    const onFsChange = () => setIsLiveFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const fmtNum = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  };

  const ITEMS_PER_PAGE = 12;

  useEffect(() => { setCurrentPage(0); }, [viewType, selectedCategory]);

  const streamsRef = useRef<LiveStream[]>([]);
  streamsRef.current = streams;
  const streamIdsRef = useRef<string>('');

  const fetchYtViewers = useCallback(() => {
    const ids = streamsRef.current
      .filter(s => (s as any).youtube_id)
      .map(s => (s as any).youtube_id as string)
      .slice(0, 50);
    if (ids.length === 0) return;
    fetch(`/api/youtube-stats?ids=${ids.join(',')}`)
      .then(r => r.ok ? r.json() : [])
      .then((stats: YTStats[]) => {
        const map: Record<string, number | undefined> = {};
        stats.forEach(s => { map[s.id] = s.concurrentViewers; });
        setYtViewers(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const start = () => {
      refreshTimerRef.current = setInterval(fetchYtViewers, 3 * 60_000);
    };
    const stop = () => clearInterval(refreshTimerRef.current);
    const onVisibility = () => document.hidden ? stop() : start();
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [fetchYtViewers]);

  useEffect(() => {
    const key = streams.map(s => (s as any).youtube_id || s.id).join(',');
    if (key && key !== streamIdsRef.current) {
      streamIdsRef.current = key;
      fetchYtViewers();
    }
  }, [streams, fetchYtViewers]);

  useEffect(() => {
    fetch('/api/page-banner?page=live')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBanner(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

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
    const ytId = s.youtube_id;
    if (ytId) return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
    return s.stream_url ?? null;
  };

  const isEmbeddable = (s: any): boolean => {
    if (s.youtube_id) return true;
    const url: string = s.stream_url ?? '';
    return url.endsWith('.m3u8');
  };

  return (
    <main className="flex-1 overflow-y-auto pb-24">
      {/* ═══════════════════════════════════════════ BANNER ═══════════════════════════════════════════ */}
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
        {/* ═══════════════════════════════════════════ SEARCH ═══════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par titre ou streamer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
          />
        </motion.div>

        {/* ═══════════════════════════════════════════ TABS: LIVE vs IPTV ═══════════════════════════════════════════ */}
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
              onClick={() => { setViewType(id as any); setShowIPTV(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                viewType === id && !showIPTV
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </motion.button>
          ))}
          
          {/* IPTV Toggle */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowIPTV(!showIPTV)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              showIPTV
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Globe size={15} />
            Chaînes IPTV
          </motion.button>
        </div>

        {/* ═══════════════════════════════════════════ CATEGORY CHIPS ═══════════════════════════════════════════ */}
        {!showIPTV && (
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
        )}

        {/* ═══════════════════════════════════════════ IPTV COUNTRY SELECTOR ═══════════════════════════════════════════ */}
        {showIPTV && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50">
              <Globe size={20} className="text-orange-600 dark:text-orange-400" />
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Sélectionner un pays</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {COUNTRIES.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ LOADING ═══════════════════════════════════════════ */}
        {isLoading || iptvLoading && showIPTV ? (
          <div className="flex items-center justify-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full" />
          </div>
        ) : null}

        {/* ═══════════════════════════════════════════ LIVE STREAMS GRID ═══════════════════════════════════════════ */}
        {!showIPTV && !isLoading && paginatedStreams.length > 0 && (
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
                        <span className="absolute top-2 left-2 bg-gray-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Hors ligne</span>
                      )}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug">{stream.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stream.streamer}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full">{stream.category}</span>
                        {stream.is_live && (() => {
                          const ytId = (stream as any).youtube_id as string | undefined;
                          const ytCount = ytId ? ytViewers[ytId] : undefined;
                          const count = ytCount ?? stream.viewers ?? 0;
                          return (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Users size={10} className="text-red-400" />
                              <span className="font-medium">{fmtNum(count)}</span>
                              {ytCount !== undefined && <span className="text-red-400 font-bold">●</span>}
                            </span>
                          );
                        })()}
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

        {/* ═══════════════════════════════════════════ IPTV CHANNELS GRID ═══════════════════════════════════════════ */}
        {showIPTV && !iptvLoading && iptvChannels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {iptvChannels.map((channel) => (
              <motion.div
                key={`${channel.name}-${channel.url}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                onClick={() => setActiveIPTVChannel(channel)}
              >
                <div className="relative overflow-hidden aspect-video bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-900/40 dark:to-orange-800/40 flex items-center justify-center">
                  {channel.logo ? (
                    <img src={channel.logo} alt={channel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <ImageIcon size={48} className="text-orange-600 dark:text-orange-400 opacity-50" />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Play size={20} className="text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{channel.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Globe size={12} />
                    <span className="font-medium">{channel.country}</span>
                  </div>
                  {channel.category && (
                    <span className="text-[11px] bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-full inline-block">{channel.category}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════ EMPTY STATES ═══════════════════════════════════════════ */}
        {!isLoading && !showIPTV && paginatedStreams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Radio size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Aucun stream trouvé</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Revenez plus tard pour du contenu en direct</p>
          </div>
        )}

        {!iptvLoading && showIPTV && iptvChannels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Globe size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Aucune chaîne trouvée</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sélectionnez un autre pays</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ LIVE STREAM PLAYER MODAL ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {activeStream && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveStream(null)}
          >
            <motion.div
              ref={livePlayerRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-black rounded-lg overflow-hidden shadow-2xl ${isLiveFullscreen ? 'fixed inset-0 rounded-none z-[9999]' : 'relative w-full max-w-4xl'}`}
            >
              {/* Player */}
              <div className="relative w-full aspect-video bg-black">
                {activeStream.youtube_id ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${activeStream.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : activeStream.stream_url?.endsWith('.m3u8') ? (
                  <HLSVideoPlayer url={activeStream.stream_url} autoplay muted={false} />
                ) : (
                  <video src={activeStream.stream_url} autoPlay controls className="w-full h-full" />
                )}
              </div>

              {/* Close button */}
              {!isLiveFullscreen && (
                <button
                  onClick={() => setActiveStream(null)}
                  className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              )}

              {/* Stream Info */}
              {!isLiveFullscreen && (
                <div className="p-6 text-white space-y-3 bg-gradient-to-t from-black to-black/50">
                  <div>
                    <h2 className="text-2xl font-bold">{activeStream.title}</h2>
                    <p className="text-gray-300 text-sm mt-1">Par {activeStream.streamer}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="bg-red-600 px-3 py-1 rounded-full font-semibold">{activeStream.category}</span>
                    {activeStream.is_live && (
                      <>
                        <span className="flex items-center gap-1 text-green-400">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          EN DIRECT
                        </span>
                        {(() => {
                          const ytId = activeStream.youtube_id as string | undefined;
                          const ytCount = ytId ? ytViewers[ytId] : undefined;
                          const count = ytCount ?? activeStream.viewers ?? 0;
                          return (
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {fmtNum(count)} spectateurs
                              {ytCount !== undefined && <span className="text-red-400 font-bold">●</span>}
                            </span>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════ IPTV CHANNEL PLAYER MODAL ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {activeIPTVChannel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveIPTVChannel(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black rounded-lg overflow-hidden shadow-2xl relative w-full max-w-4xl"
            >
              {/* HLS Player */}
              <div className="relative w-full aspect-video bg-black">
                <HLSVideoPlayer
                  url={activeIPTVChannel.url}
                  title={activeIPTVChannel.name}
                  autoplay
                  muted={false}
                />
              </div>

              {/* Close button */}
              <button
                onClick={() => setActiveIPTVChannel(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <X size={20} className="text-white" />
              </button>

              {/* Channel Info */}
              <div className="p-6 text-white space-y-3 bg-gradient-to-t from-black to-black/50">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {activeIPTVChannel.logo && (
                      <img src={activeIPTVChannel.logo} alt={activeIPTVChannel.name} className="w-8 h-8 rounded" />
                    )}
                    {activeIPTVChannel.name}
                  </h2>
                  {activeIPTVChannel.groupTitle && (
                    <p className="text-gray-300 text-sm mt-1">{activeIPTVChannel.groupTitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-orange-600 px-3 py-1 rounded-full font-semibold">{activeIPTVChannel.country}</span>
                  {activeIPTVChannel.category && (
                    <span className="bg-amber-700 px-3 py-1 rounded-full font-semibold">{activeIPTVChannel.category}</span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
