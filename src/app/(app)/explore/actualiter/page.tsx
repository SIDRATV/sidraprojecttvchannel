'use client';

export const dynamic = 'force-dynamic';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Search,
  User,
  Heart,
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Clock,
  BookOpen,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ArticleComment {
  id: string;
  content: string;
  user_id: string;
  author_name: string;
  avatar_url: string;
  created_at: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  image_url: string;
  read_time: number;
  featured: boolean;
  likes_count: number;
  comments_count: number;
  published_at: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export default function ActualiterPage() {
  const { session } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentPosting, setCommentPosting] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/news-articles');
      const data = await res.json();
      if (data.articles) setArticles(data.articles);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const fetchComments = useCallback(async (articleId: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/news-articles?articleId=${articleId}&comments=true`);
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedArticle) {
      fetchComments(selectedArticle.id);
    } else {
      setComments([]);
    }
  }, [selectedArticle, fetchComments]);

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = filteredArticles.filter((a) => a.featured);
  const regularArticles = filteredArticles.filter((a) => !a.featured);

  const toggleLike = async (articleId: string) => {
    if (!session?.access_token) return;
    const isLiked = likedArticles.has(articleId);
    const newLiked = new Set(likedArticles);
    if (isLiked) newLiked.delete(articleId);
    else newLiked.add(articleId);
    setLikedArticles(newLiked);

    try {
      await fetch('/api/news-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'like', articleId }),
      });
      await fetchArticles();
    } catch {
      if (isLiked) newLiked.add(articleId);
      else newLiked.delete(articleId);
      setLikedArticles(new Set(newLiked));
    }
  };

  const handleAddComment = async () => {
    if (!selectedArticle || !newComment.trim() || !session?.access_token) return;
    setCommentPosting(true);
    try {
      const res = await fetch('/api/news-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'comment',
          articleId: selectedArticle.id,
          content: newComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        await fetchComments(selectedArticle.id);
        await fetchArticles();
      }
    } catch {
      // silently fail
    } finally {
      setCommentPosting(false);
    }
  };

  const shareArticle = (platform: string) => {
    if (!selectedArticle) return;
    const text = encodeURIComponent(`Découvrez: ${selectedArticle.title}`);
    const url = encodeURIComponent(window.location.href);
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={40} className="text-brand-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1a14] to-slate-950 p-4 md:p-8 overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-20 w-80 h-80 bg-orange-500/8 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-40 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/3 w-60 h-60 bg-amber-500/5 rounded-full blur-[100px]"
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80 }}
        className="mb-10"
      >
        <div className="flex items-center gap-4 mb-3">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30"
          >
            <Newspaper className="text-white" size={28} />
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-orange-300 to-amber-200 bg-clip-text text-transparent">
              Actualités
            </h1>
            <p className="text-slate-400 text-sm mt-1">Dernières nouvelles de la communauté Sidra</p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-all border backdrop-blur-xl ${
            selectedCategory === null
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-lg shadow-orange-500/10'
              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Flame size={14} /> Tout
        </motion.button>
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all border backdrop-blur-xl ${
              selectedCategory === cat
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-lg shadow-orange-500/10'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </motion.div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <motion.section variants={containerVariants} initial="hidden" animate="visible" className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-orange-400" />
            À la Une
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredArticles.map((article) => (
              <motion.div
                key={article.id}
                variants={itemVariants}
                whileHover={{ y: -6 }}
                className="relative group cursor-pointer"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                <div className="relative bg-white/[0.03] backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/[0.15] transition-all">
                  <div className="relative h-56 overflow-hidden">
                    {article.image_url ? (
                      <div
                        className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
                        style={{ backgroundImage: `url(${article.image_url})` }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-500/30 to-red-500/20 flex items-center justify-center">
                        <Newspaper size={48} className="text-orange-400/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <span className="absolute top-4 right-4 px-3 py-1.5 bg-red-500/20 backdrop-blur-xl text-red-300 text-xs font-bold rounded-full border border-red-500/30">
                      À LA UNE
                    </span>
                    <span className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/10 backdrop-blur-xl text-white text-xs font-semibold rounded-full border border-white/20">
                      {article.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-300 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4 py-3 border-y border-white/[0.06]">
                      <span className="flex items-center gap-1"><User size={12} /> {article.author}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(article.published_at)}</span>
                      <span className="flex items-center gap-1"><BookOpen size={12} /> {article.read_time} min</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(article.id); }}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${
                          likedArticles.has(article.id) ? 'text-red-400' : 'text-slate-500 hover:text-red-400'
                        }`}
                      >
                        <Heart size={15} fill={likedArticles.has(article.id) ? 'currentColor' : 'none'} />
                        {article.likes_count}
                      </button>
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MessageCircle size={15} /> {article.comments_count}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Regular Articles */}
      <motion.section variants={containerVariants} initial="hidden" animate="visible">
        <h2 className="text-xl font-bold text-white mb-6">Derniers Articles</h2>
        <div className="space-y-4">
          {regularArticles.map((article) => (
            <motion.div
              key={article.id}
              variants={itemVariants}
              whileHover={{ x: 4 }}
              className="relative group cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="flex gap-4 md:gap-6 p-4 bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all">
                {article.image_url ? (
                  <div
                    className="w-24 h-24 md:w-32 md:h-28 rounded-xl bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${article.image_url})` }}
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-28 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Newspaper size={24} className="text-orange-400/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-orange-500/15 text-orange-400 text-xs font-semibold rounded-lg">
                      {article.category}
                    </span>
                    <span className="text-xs text-slate-600">{timeAgo(article.published_at)}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1 line-clamp-2 group-hover:text-orange-300 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-1">{article.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><User size={12} /> {article.author}</span>
                      <span><BookOpen size={12} className="inline" /> {article.read_time} min</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(article.id); }}
                        className={`flex items-center gap-1 transition-colors ${
                          likedArticles.has(article.id) ? 'text-red-400' : 'text-slate-500 hover:text-red-400'
                        }`}
                      >
                        <Heart size={13} fill={likedArticles.has(article.id) ? 'currentColor' : 'none'} />
                        {article.likes_count}
                      </button>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MessageCircle size={13} /> {article.comments_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Empty State */}
      {filteredArticles.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/[0.04] backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/[0.08]">
            <Newspaper size={36} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg font-medium">Aucun article trouvé</p>
          <p className="text-slate-600 text-sm mt-2">Les articles apparaîtront ici une fois publiés</p>
        </motion.div>
      )}

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl my-8 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-4 right-4 z-20">
                <button onClick={() => setSelectedArticle(null)} className="p-2 bg-black/40 backdrop-blur-xl hover:bg-white/10 rounded-lg transition-colors text-slate-300">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {selectedArticle.image_url && (
                  <div
                    className="w-full h-48 md:h-64 bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${selectedArticle.image_url})` }}
                  />
                )}

                <div className="p-5 md:p-8">
                  <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-white/[0.08]">
                    <span className="px-3 py-1 bg-orange-500/15 text-orange-400 rounded-full text-xs font-semibold">
                      {selectedArticle.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><User size={12} /> {selectedArticle.author}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> {timeAgo(selectedArticle.published_at)}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><BookOpen size={12} /> {selectedArticle.read_time} min</span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">{selectedArticle.title}</h1>

                  <div className="mb-8">
                    {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="text-sm md:text-base text-slate-300 mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Share + Like Row */}
                  <div className="flex flex-wrap items-center gap-3 py-4 border-y border-white/[0.08] mb-6">
                    <span className="text-xs font-semibold text-slate-400">Partager:</span>
                    {['facebook', 'twitter', 'linkedin'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => shareArticle(platform)}
                        className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-xs text-slate-400 capitalize transition-colors"
                      >
                        {platform}
                      </button>
                    ))}
                    <div className="flex-1" />
                    <button
                      onClick={() => toggleLike(selectedArticle.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all border backdrop-blur-xl ${
                        likedArticles.has(selectedArticle.id)
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-red-300'
                      }`}
                    >
                      <Heart size={15} fill={likedArticles.has(selectedArticle.id) ? 'currentColor' : 'none'} />
                      {selectedArticle.likes_count}
                    </button>
                  </div>

                  {/* Comments Section */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <MessageCircle size={18} />
                      Commentaires ({selectedArticle.comments_count})
                    </h3>

                    {session ? (
                      <div className="flex gap-2 mb-6">
                        <input
                          type="text"
                          placeholder="Écrire un commentaire..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          className="flex-1 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                        />
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          disabled={commentPosting || !newComment.trim()}
                          onClick={handleAddComment}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
                        >
                          {commentPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </motion.button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mb-6">Connectez-vous pour commenter</p>
                    )}

                    {commentsLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 size={20} className="animate-spin text-slate-500" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-xs text-white font-bold">
                                {(comment.author_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold text-white">{comment.author_name || 'Utilisateur'}</span>
                              <span className="text-[10px] text-slate-600">{timeAgo(comment.created_at)}</span>
                            </div>
                            <p className="text-sm text-slate-300 pl-8">{comment.content}</p>
                          </motion.div>
                        ))}
                        {comments.length === 0 && (
                          <p className="text-sm text-slate-600 text-center py-4">Aucun commentaire pour le moment</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
