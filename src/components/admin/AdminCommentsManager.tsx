'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Shield, Plus, X, AlertTriangle, MessageSquare,
  Loader2, Search, RefreshCw, Send
} from 'lucide-react';

interface BannedWord {
  id: string;
  word: string;
  created_at: string;
}

interface AdminComment {
  id: string;
  content: string;
  likes: number;
  is_deleted: boolean;
  deleted_reason: string | null;
  created_at: string;
  premium_video_id: string;
  users: { id: string; full_name: string | null; avatar_url: string | null } | null;
  premium_videos: { title: string } | null;
}

interface AdminCommentsManagerProps {
  token: string;
}

export function AdminCommentsManager({ token }: AdminCommentsManagerProps) {
  const [tab, setTab] = useState<'comments' | 'words'>('comments');

  // ── Banned words state ──────────────────────────────────
  const [words, setWords] = useState<BannedWord[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [addingWord, setAddingWord] = useState(false);
  const [wordError, setWordError] = useState('');

  // ── Comments state ──────────────────────────────────────
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [searchVideo, setSearchVideo] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [warningModal, setWarningModal] = useState<AdminComment | null>(null);
  const [warningReason, setWarningReason] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Fetch banned words ──────────────────────────────────
  const fetchWords = useCallback(async () => {
    setWordsLoading(true);
    try {
      const res = await fetch('/api/admin/banned-words', { headers: authHeaders });
      const data = await res.json();
      setWords(data.words || []);
    } catch {}
    setWordsLoading(false);
  }, [token]);

  // ── Fetch comments ──────────────────────────────────────
  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const url = new URL('/api/admin/comments', window.location.origin);
      url.searchParams.set('limit', '100');
      const res = await fetch(url.toString(), { headers: authHeaders });
      const data = await res.json();
      setComments(data.comments || []);
    } catch {}
    setCommentsLoading(false);
  }, [token]);

  useEffect(() => {
    if (tab === 'words') fetchWords();
    else fetchComments();
  }, [tab]);

  // ── Add banned word ─────────────────────────────────────
  const handleAddWord = async () => {
    const w = newWord.trim().toLowerCase();
    if (!w) return;
    setAddingWord(true);
    setWordError('');
    try {
      const res = await fetch('/api/admin/banned-words', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ word: w }),
      });
      const data = await res.json();
      if (!res.ok) { setWordError(data.error || 'Erreur'); }
      else { setWords(prev => [data.word, ...prev]); setNewWord(''); }
    } catch { setWordError('Erreur réseau'); }
    setAddingWord(false);
  };

  const handleDeleteWord = async (id: string) => {
    await fetch(`/api/admin/banned-words?id=${id}`, { method: 'DELETE', headers: authHeaders });
    setWords(prev => prev.filter(w => w.id !== id));
  };

  // ── Delete comment ──────────────────────────────────────
  const handleDeleteComment = async (comment: AdminComment, sendWarning = false) => {
    setDeletingId(comment.id);
    await fetch('/api/admin/comments', {
      method: 'DELETE',
      headers: authHeaders,
      body: JSON.stringify({
        commentId: comment.id,
        reason: warningReason || 'Contenu inapproprié',
        sendWarning,
        userId: comment.users?.id,
      }),
    });
    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, is_deleted: true } : c));
    setDeletingId(null);
    setWarningModal(null);
    setWarningReason('');
  };

  // ── Send warning only ───────────────────────────────────
  const handleSendWarning = async () => {
    if (!warningModal) return;
    setSendingWarning(true);
    await handleDeleteComment(warningModal, true);
    setSendingWarning(false);
  };

  const filtered = comments.filter(c => {
    if (!showDeleted && c.is_deleted) return false;
    if (searchVideo) {
      const title = c.premium_videos?.title?.toLowerCase() || '';
      const content = c.content.toLowerCase();
      const user = c.users?.full_name?.toLowerCase() || '';
      return title.includes(searchVideo.toLowerCase()) ||
        content.includes(searchVideo.toLowerCase()) ||
        user.includes(searchVideo.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('comments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'comments'
              ? 'bg-brand-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <MessageSquare size={15} />
          Commentaires
        </button>
        <button
          onClick={() => setTab('words')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'words'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Shield size={15} />
          Mots interdits
        </button>
      </div>

      {/* ── BANNED WORDS TAB ── */}
      {tab === 'words' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Les commentaires contenant ces mots seront automatiquement refusés lors de la soumission.
          </p>

          {/* Add word */}
          <div className="flex gap-2">
            <input
              value={newWord}
              onChange={e => { setNewWord(e.target.value); setWordError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAddWord()}
              placeholder="Ajouter un mot interdit…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            <button
              onClick={handleAddWord}
              disabled={addingWord || !newWord.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {addingWord ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajouter
            </button>
          </div>
          {wordError && <p className="text-xs text-red-500">{wordError}</p>}

          {wordsLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-red-500" /></div>
          ) : words.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun mot interdit configuré.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {words.map(w => (
                <span
                  key={w.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-700/50"
                >
                  {w.word}
                  <button
                    onClick={() => handleDeleteWord(w.id)}
                    className="hover:text-red-900 dark:hover:text-red-200 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COMMENTS TAB ── */}
      {tab === 'comments' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchVideo}
                onChange={e => setSearchVideo(e.target.value)}
                placeholder="Rechercher par vidéo, user, contenu…"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={e => setShowDeleted(e.target.checked)}
                className="rounded"
              />
              Afficher supprimés
            </label>
            <button
              onClick={fetchComments}
              disabled={commentsLoading}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={15} className={`text-gray-600 dark:text-gray-300 ${commentsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {commentsLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun commentaire trouvé.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(comment => (
                <div
                  key={comment.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    comment.is_deleted
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 opacity-60'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-800 dark:text-white">
                        {comment.users?.full_name || 'Utilisateur inconnu'}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-brand-500 truncate max-w-xs">
                        {comment.premium_videos?.title || comment.premium_video_id}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{comment.content}</p>
                    {comment.is_deleted && comment.deleted_reason && (
                      <p className="text-xs text-red-500">Raison : {comment.deleted_reason}</p>
                    )}
                  </div>

                  {!comment.is_deleted && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Delete with warning */}
                      <button
                        onClick={() => { setWarningModal(comment); setWarningReason(''); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 text-xs font-medium rounded-lg transition-colors"
                        title="Supprimer et avertir"
                      >
                        <AlertTriangle size={12} />
                        Avertir
                      </button>
                      {/* Delete silently */}
                      <button
                        onClick={() => handleDeleteComment(comment, false)}
                        disabled={deletingId === comment.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 text-xs font-medium rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        {deletingId === comment.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Trash2 size={12} />
                        }
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Warning Modal ── */}
      <AnimatePresence>
        {warningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setWarningModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Supprimer & Avertir l'utilisateur
                </h3>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300 italic">
                « {warningModal.content} »
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Raison de la suppression (envoyée dans la notification)
                </label>
                <textarea
                  value={warningReason}
                  onChange={e => setWarningReason(e.target.value)}
                  rows={3}
                  placeholder="Ex: Insulte envers un autre membre…"
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setWarningModal(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteComment(warningModal, false)}
                  disabled={deletingId === warningModal.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Trash2 size={14} />
                  Suppr. uniquement
                </button>
                <button
                  onClick={handleSendWarning}
                  disabled={sendingWarning}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {sendingWarning ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Suppr. + Avertir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
