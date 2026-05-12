'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';

/**
 * Thin banner that appears at the top of the screen (via portal) whenever
 * a new version of the app is available.  The user can dismiss it (it comes
 * back next page load until the update is applied) or click "Mettre à jour"
 * which triggers SKIP_WAITING → page reload.
 */
export function PWAUpdateBanner() {
  const { updateAvailable, currentVersion, latestVersion, isUpdating, applyUpdate } = usePWAUpdate();

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          key="pwa-update-banner"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white text-sm shadow-lg"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={16} className="flex-shrink-0 animate-pulse" />
            <span className="font-medium truncate">
              Nouvelle version disponible
              {currentVersion && latestVersion && currentVersion !== latestVersion
                ? ` (v${latestVersion})`
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={applyUpdate}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-semibold text-xs transition-colors disabled:opacity-60"
            >
              <RefreshCw size={13} className={isUpdating ? 'animate-spin' : ''} />
              {isUpdating ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
