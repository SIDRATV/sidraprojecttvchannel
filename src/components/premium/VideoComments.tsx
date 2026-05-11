'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Trash2, MessageCircle, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, CornerDownRight, X, Flame,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

interface CommentUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  likes: number;
  dislikes: number;
  userVote: 1 | -1 | null;
  created_at: string;
  users: CommentUser | null;
  replies?: Comment[];
  parent_id?: string | null;
}

interface VideoCommentsProps {
  videoId: string;
}

const RULES = [
  'Respectez les autres membres de la communauté.',
  'Pas de propos haineux, racistes ou discriminatoires.',
  'Pas de spam ni de publicité non sollicitée.',
  'Les insultes entraînent la suppression du commentaire.',
  'Tout abus répété peut mener à un avertissement ou un bannissement.',
];

/* ─── Avatar ────────────────────────────────────────────── */
function CommentAvatar({ user, size = 8 }: { user: CommentUser | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = user?.avatar_url || '';
  const initials = (user?.full_name || 'U').slice(0, 2).toUpperCase();
  const px = size * 4;
  if (!src || failed) {
    return (
      <div
        style={{ width: px, height: px }}
        className="rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0"
      >
        <span className="text-white font-bold" style={{ fontSize: px / 3 }}>{initials}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={user?.full_name || 'User'}
      width={px}
      height={px}
      style={{ width: px, height: px }}
      className="rounded-full object-cover flex-shrink-0"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

function formatRel(dateStr: string): string {
  const d = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (d < 60) return 'À l\'instant';
  if (d < 3600) return `${Math.floor(d / 60)} min`;
  if (d < 86400) return `${Math.floor(d / 3600)} h`;
  return `${Math.floor(d / 86400)} j`;
}

/* ─── Single comment card ────────────────────────────────── */
interface CardProps {
  comment: Comment;
  currentUserId?: string;
  session: any;
  videoId: string;
  onVote: (id: string, v: 1 | -1 | 0) => void;
  onReplyPosted: (reply: Comment, parentId: string) => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
}

function CommentCard({ comment, currentUserId, session, videoId, onVote, onReplyPosted, onDelete, isReply = false }: CardProps) {
  const [showForm, setShowForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyErr, setReplyErr] = useState('');
  const [showReplies, setShowReplies] = useState(true);

  const handleReply = async () => {
    if (!replyText.trim() || !session?.access_token) return;
    setPosting(true); setReplyErr('');
    const res = await fetch(`/api/premium-videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ content: replyText.trim(), parentId: comment.id }),
    }).catch(() => null);
    if (!res) { setReplyErr('Erreur réseau'); setPosting(false); return; }
    const data = await res.json();
    if (!res.ok) setReplyErr(data.error || 'Erreur');
    else { onReplyPosted(data.comment, comment.id); setReplyText(''); setShowForm(false); }
    setPosting(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3 group/c">
        <CommentAvatar user={comment.users} size={isReply ? 7 : 8} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {comment.users?.full_name || 'Utilisateur'}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">{formatRel(comment.created_at)}</span>
          </div>
          {/* Bubble */}
          <div className="inline-block px-3.5 py-2.5 rounded-2xl text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap break-words max-w-full">
            {comment.content}
          </div>
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-1.5 pl-1">
            <button
              onClick={() => onVote(comment.id, comment.userVote === 1 ? 0 : 1)}
              className={`flex items-center gap-1 text-xs transition-colors ${comment.userVote === 1 ? 'text-green-500 font-semibold' : 'text-gray-400 hover:text-green-500'}`}
            >
              <ThumbsUp size={13} className={comment.userVote === 1 ? 'fill-current' : ''} />
              {comment.likes > 0 && comment.likes}
            </button>
            <button
              onClick={() => onVote(comment.id, comment.userVote === -1 ? 0 : -1)}
              className={`flex items-center gap-1 text-xs transition-colors ${comment.userVote === -1 ? 'text-red-500 font-semibold' : 'text-gray-400 hover:text-red-500'}`}
            >
              <ThumbsDown size={13} className={comment.userVote === -1 ? 'fill-current' : ''} />
              {comment.dislikes > 0 && comment.dislikes}
            </button>
            {!isReply && currentUserId && (
              <button
                onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-500 transition-colors"
              >
                <CornerDownRight size={13} />
                Répondre
              </button>
            )}
            {!isReply && (comment.replies?.length ?? 0) > 0 && (
              <button
                onClick={() => setShowReplies(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {comment.replies!.length} réponse{comment.replies!.length > 1 ? 's' : ''}
              </button>
            )}
            {currentUserId && comment.users?.id === currentUserId && (
              <button
                onClick={() => onDelete(comment.id)}
                className="opacity-0 group-hover/c:opacity-100 ml-auto text-xs text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          {/* Reply form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 flex gap-2 overflow-hidden"
              >
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                  placeholder="Répondre…"
                  maxLength={500}
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={15} /></button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || posting}
                  className="p-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {replyErr && <p className="text-xs text-red-500 mt-1">{replyErr}</p>}
        </div>
      </div>

      {/* Replies */}
      {!isReply && showReplies && (comment.replies?.length ?? 0) > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-gray-200 dark:border-gray-700/50 pl-4">
          {comment.replies!.map(r => (
            <CommentCard
              key={r.id}
              comment={r}
              currentUserId={currentUserId}
              session={session}
              videoId={videoId}
              onVote={onVote}
              onReplyPosted={onReplyPosted}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Carousel variants ─────────────────────────────────── */
const carouselVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.25 } }),
};

/* ─── Main component ────────────────────────────────────── */
export function VideoComments({ videoId }: VideoCommentsProps) {
  const { user, session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselDir, setCarouselDir] = useState(1);
  const topCommentsRef = useRef<Comment[]>([]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const headers: Record<string, string> = {};
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    const res = await fetch(`/api/premium-videos/${videoId}/comments`, { headers }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    }
    setLoading(false);
  }, [videoId, session?.access_token]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Carousel auto-advance
  useEffect(() => {
    if (topCommentsRef.current.length < 2) return;
    const t = setInterval(() => {
      const max = Math.min(topCommentsRef.current.length, 5);
      setCarouselDir(1);
      setCarouselIndex(i => (i + 1) % max);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const handleVote = useCallback(async (commentId: string, vote: 1 | -1 | 0) => {
    if (!session?.access_token) return;
    // Optimistic update
    setComments(prev => {
      const updateVote = (list: Comment[]): Comment[] => list.map(c => {
        if (c.id === commentId) {
          const old = c.userVote ?? 0;
          const likesDelta = (old === 1 ? -1 : 0) + (vote === 1 ? 1 : 0);
          const dislikesDelta = (old === -1 ? -1 : 0) + (vote === -1 ? 1 : 0);
          return {
            ...c,
            userVote: vote === 0 ? null : vote,
            likes: Math.max(0, c.likes + likesDelta),
            dislikes: Math.max(0, c.dislikes + dislikesDelta),
          };
        }
        if (c.replies?.length) return { ...c, replies: updateVote(c.replies) };
        return c;
      });
      return updateVote(prev).sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
    });
    await fetch(`/api/premium-videos/${videoId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ commentId, vote }),
    }).catch(() => null);
  }, [session?.access_token, videoId]);

  const handlePost = async () => {
    if (!text.trim() || !session?.access_token) return;
    setPosting(true); setPostError('');
    const res = await fetch(`/api/premium-videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ content: text.trim() }),
    }).catch(() => null);
    if (!res) { setPostError('Erreur réseau'); setPosting(false); return; }
    const data = await res.json();
    if (!res.ok) setPostError(data.error || 'Erreur');
    else {
      setText('');
      setComments(prev => [data.comment, ...prev]);
    }
    setPosting(false);
  };

  const handleReplyPosted = useCallback((reply: Comment, parentId: string) => {
    setComments(prev => prev.map(c =>
      c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c
    ));
  }, []);

  const handleDelete = useCallback(async (commentId: string) => {
    if (!session?.access_token) return;
    setComments(prev => {
      const remove = (list: Comment[]): Comment[] =>
        list.filter(c => c.id !== commentId).map(c => ({ ...c, replies: remove(c.replies || []) }));
      return remove(prev);
    });
    await fetch(`/api/premium-videos/${videoId}/comments?commentId=${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => null);
  }, [session?.access_token, videoId]);

  // Top-level comments (sorted by net score)
  const topLevel = comments.filter(c => !c.parent_id);
  const topComments = topLevel.filter(c => c.likes > 0 || c.replies?.length);
  topCommentsRef.current = topComments.length >= 2 ? topComments : topLevel;

  const showCarousel = topLevel.length >= 2;
  const carouselItems = topLevel.slice(0, 5);
  const visibleComments = expanded ? topLevel : topLevel.slice(0, 1);
  const hiddenCount = topLevel.length - 1;

  return (
    <div className="mt-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <MessageCircle size={20} className="text-brand-500" />
          Commentaires
          {!loading && topLevel.length > 0 && (
            <span className="text-sm font-normal text-gray-400">({topLevel.length})</span>
          )}
        </h2>
        <button
          onClick={() => setShowRules(v => !v)}
          className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline"
        >
          <AlertTriangle size={13} />
          Règles
        </button>
      </div>

      {/* Rules */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold mb-1.5">📋 Règles de la communauté</p>
              {RULES.map((r, i) => (
                <p key={i} className="flex gap-2"><span className="font-bold text-amber-500">{i + 1}.</span>{r}</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carousel — top comments cycling */}
      {showCarousel && carouselItems.length > 0 && (
        <div className="relative bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border border-brand-100 dark:border-brand-800/40 rounded-2xl p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-brand-500" />
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide">Les plus actifs</span>
          </div>
          <div className="relative min-h-[64px] overflow-hidden">
            <AnimatePresence custom={carouselDir} mode="wait">
              <motion.div
                key={carouselIndex}
                custom={carouselDir}
                variants={carouselVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex gap-3"
              >
                {carouselItems[carouselIndex % carouselItems.length] && (() => {
                  const c = carouselItems[carouselIndex % carouselItems.length];
                  return (
                    <>
                      <CommentAvatar user={c.users} size={8} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.users?.full_name || 'Utilisateur'}</span>
                          <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                            <ThumbsUp size={11} fill="currentColor" /> {c.likes}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{c.content}</p>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {carouselItems.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCarouselDir(i > carouselIndex ? 1 : -1); setCarouselIndex(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === carouselIndex % carouselItems.length ? 'bg-brand-500 w-4' : 'bg-gray-300 dark:bg-gray-600'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Comment input */}
      {user ? (
        <div className="flex gap-3">
          <CommentAvatar
            user={{ id: user.id, full_name: (user as any).full_name || user.email || 'Vous', avatar_url: (user as any).avatar_url || null }}
            size={8}
          />
          <div className="flex-1 space-y-2">
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setPostError(''); }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost(); }}
              placeholder="Partagez votre avis… (Ctrl+Entrée)"
              rows={2}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
            />
            {postError && <p className="text-xs text-red-500">{postError}</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{text.length}/1000</span>
              <button
                onClick={handlePost}
                disabled={!text.trim() || posting}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-5 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          Connectez-vous pour commenter.
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={26} className="animate-spin text-brand-500" /></div>
      ) : topLevel.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">Soyez le premier à commenter !</div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence initial={false}>
            {visibleComments.map(comment => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
              >
                <CommentCard
                  comment={comment}
                  currentUserId={user?.id}
                  session={session}
                  videoId={videoId}
                  onVote={handleVote}
                  onReplyPosted={handleReplyPosted}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Show more / less */}
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-brand-500 hover:text-brand-600 border border-brand-200 dark:border-brand-800/50 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
            >
              {expanded
                ? <><ChevronUp size={15} /> Voir moins</>
                : <><ChevronDown size={15} /> Voir les {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} commentaire{hiddenCount > 1 ? 's' : ''}</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}


interface CommentUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  likes: number;
  created_at: string;
  users: CommentUser | null;
}

interface VideoCommentsProps {
  videoId: string;
}

const COMMUNITY_RULES = [
  'Respectez les autres membres de la communauté.',
  'Pas de propos haineux, racistes ou discriminatoires.',
  'Pas de spam ni de publicité non sollicitée.',
  'Les insultes et le harcèlement entraînent la suppression du commentaire.',
  'Tout abus répété peut mener à un avertissement ou un bannissement.',
];

function CommentAvatar({ user }: { user: CommentUser | null }) {
  const [failed, setFailed] = useState(false);
  const src = user?.avatar_url || '';
  const initials = (user?.full_name || 'U').slice(0, 2).toUpperCase();

  if (!src || failed) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">{initials}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={user?.full_name || 'User'}
      width={32}
      height={32}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

function formatRelative(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export function VideoComments({ videoId }: VideoCommentsProps) {
  const { user, session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState('');
  const [postError, setPostError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const LIMIT = 20;

  const fetchComments = useCallback(async (reset = false) => {
    const off = reset ? 0 : offsetRef.current;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/premium-videos/${videoId}/comments?limit=${LIMIT}&offset=${off}`);
      const data = await res.json();
      const fetched: Comment[] = data.comments || [];
      if (reset) {
        setComments(fetched);
        offsetRef.current = fetched.length;
      } else {
        setComments(prev => [...prev, ...fetched]);
        offsetRef.current += fetched.length;
      }
      setHasMore(fetched.length === LIMIT);
    } catch {}
    if (reset) setLoading(false); else setLoadingMore(false);
  }, [videoId]);

  useEffect(() => { fetchComments(true); }, [fetchComments]);

  const handlePost = async () => {
    if (!text.trim() || !session?.access_token) return;
    setPosting(true);
    setPostError('');
    try {
      const res = await fetch(`/api/premium-videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPostError(data.error || 'Erreur lors de l\'envoi');
      } else {
        setText('');
        setComments(prev => [data.comment, ...prev]);
        offsetRef.current += 1;
      }
    } catch {
      setPostError('Erreur réseau');
    }
    setPosting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!session?.access_token) return;
    setDeletingId(commentId);
    try {
      await fetch(`/api/premium-videos/${videoId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setComments(prev => prev.filter(c => c.id !== commentId));
      offsetRef.current = Math.max(0, offsetRef.current - 1);
    } catch {}
    setDeletingId(null);
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <MessageCircle size={20} className="text-brand-500" />
          Commentaires
          {!loading && <span className="text-sm font-normal text-gray-400">({comments.length})</span>}
        </h2>
        <button
          onClick={() => setShowRules(v => !v)}
          className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline"
        >
          <AlertTriangle size={14} />
          Règles de la communauté
        </button>
      </div>

      {/* Rules panel */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300 space-y-1.5">
              <p className="font-semibold mb-2">📋 Règles de la communauté</p>
              {COMMUNITY_RULES.map((rule, i) => (
                <p key={i} className="flex gap-2">
                  <span className="text-amber-500 font-bold">{i + 1}.</span>
                  {rule}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment input */}
      {user ? (
        <div className="flex gap-3">
          <CommentAvatar user={{ id: user.id, full_name: (user as any).full_name || user.email || 'Vous', avatar_url: (user as any).avatar_url || null }} />
          <div className="flex-1 space-y-2">
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setPostError(''); }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost(); }}
              placeholder="Partagez votre avis… (Ctrl+Entrée pour envoyer)"
              rows={2}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none transition-colors"
            />
            {postError && (
              <p className="text-xs text-red-500 dark:text-red-400">{postError}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{text.length}/1000</span>
              <button
                onClick={handlePost}
                disabled={!text.trim() || posting}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          Connectez-vous pour laisser un commentaire.
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
          Soyez le premier à commenter !
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {comments.map(comment => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex gap-3 group"
              >
                <CommentAvatar user={comment.users} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {comment.users?.full_name || 'Utilisateur'}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatRelative(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
                {/* Delete own comment */}
                {user && comment.users?.id === user.id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="opacity-0 group-hover:opacity-100 self-start mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Supprimer"
                  >
                    {deletingId === comment.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMore && (
            <button
              onClick={() => fetchComments(false)}
              disabled={loadingMore}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-brand-500 hover:text-brand-600 disabled:opacity-60 transition-colors"
            >
              {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
              Voir plus de commentaires
            </button>
          )}
        </div>
      )}
    </div>
  );
}
