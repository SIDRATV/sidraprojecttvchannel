'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, MessageCircle, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';
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
