'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotificationPermission, hasBeenPrompted } from '@/hooks/useNotificationPermission';
import { useAuth } from '@/hooks/useAuth';

const DISMISS_KEY = 'notif_modal_dismissed_at';
const RE_PROMPT_DAYS = 7; // re-show after 7 days if still 'default'

/**
 * Modal shown automatically once to logged-in users when notification
 * permission is still 'default' (not yet granted or denied).
 * If the user dismisses, we wait RE_PROMPT_DAYS before showing again.
 */
export function NotificationPermissionModal() {
  const { user } = useAuth();
  const { permission, canRequest, requestPermission } = useNotificationPermission();
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [result, setResult] = useState<'granted' | 'denied' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !user?.id) return;
    if (permission !== 'default') return; // already decided

    // Check if we should show again
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const diff = (Date.now() - parseInt(dismissedAt)) / 86_400_000;
      if (diff < RE_PROMPT_DAYS) return;
    }

    // Small delay so the page settles first
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [mounted, user?.id, permission]);

  const handleRequest = async () => {
    setRequesting(true);
    const perm = await requestPermission();
    setRequesting(false);
    setResult(perm === 'granted' ? 'granted' : 'denied');
    setTimeout(() => { setVisible(false); setResult(null); }, 2200);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="notif-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            key="notif-modal-card"
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-brand-500/10 to-purple-500/10 dark:from-brand-500/5 dark:to-purple-500/5">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-500/10 dark:bg-brand-500/20 rounded-2xl">
                  <Bell size={28} className="text-brand-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                    Activer les notifications
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Sidra TV — votre appareil
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-3">
              {result === 'granted' && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle size={16} />
                  Notifications activées !
                </div>
              )}
              {result === 'denied' && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                  <AlertCircle size={16} />
                  Refusé — vous pouvez l'activer dans les Paramètres.
                </div>
              )}
              {!result && (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Recevez les alertes en temps réel : nouvelles vidéos, lives, transactions et avertissements directement sur votre appareil.
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {[
                      'Nouvelles vidéos premium',
                      'Lives en cours',
                      'Notifications de votre wallet',
                      'Avertissements & mises à jour',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Actions */}
            {!result && (
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleRequest}
                  disabled={requesting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {requesting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <Bell size={14} />
                  )}
                  Autoriser
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
