'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ── Constants ────────────────────────────────────────────────────────────────
// Max times the prompt is shown PER SESSION (sessionStorage resets on tab close)
const MAX_SHOWS_PER_SESSION = 3;
// localStorage key — set to 'true' once the app is installed
const LS_INSTALLED_KEY = 'pwaInstalled';
// sessionStorage key — tracks how many times prompt was shown this session
const SS_SHOWN_KEY = 'pwaShownCount';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Already installed — never show
    if (
      localStorage.getItem(LS_INSTALLED_KEY) === 'true' ||
      window.matchMedia('(display-mode: standalone)').matches
    ) return;

    // Already shown MAX_SHOWS_PER_SESSION times this session — wait for next session
    const shownCount = parseInt(sessionStorage.getItem(SS_SHOWN_KEY) ?? '0', 10);
    if (shownCount >= MAX_SHOWS_PER_SESSION) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
      // Increment the session counter immediately when we decide to show
      sessionStorage.setItem(SS_SHOWN_KEY, String(shownCount + 1));
    };

    const handleAppInstalled = () => {
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // deferredPrompt kept — browser may re-fire on next page load within same session
  };

  if (!deferredPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Install Prompt Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-gradient-to-br from-brand-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-brand-200/50 dark:border-brand-400/20 p-6 sm:p-8 w-full max-w-md">
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 hover:bg-brand-200 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>

              {/* Content */}
              <div className="text-center space-y-4 sm:space-y-6 mt-4">
                {/* Logo */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex justify-center"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                    <Image
                      src="/sidra-logo.webp"
                      alt="Sidra TV"
                      fill
                      className="object-contain"
                    />
                  </div>
                </motion.div>

                {/* Title */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-950 dark:text-white">
                    Install Sidra TV
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                    Get quick access to premium Islamic media right from your home screen
                  </p>
                </div>

                {/* Features */}
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3 text-left">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-950 dark:text-white text-xs sm:text-sm">Offline Access</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Watch content anytime, anywhere</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-950 dark:text-white text-xs sm:text-sm">App Experience</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Native app feel without the app store</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-950 dark:text-white text-xs sm:text-sm">Fast Loading</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Optimized performance on all devices</p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    className="py-2.5 sm:py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Maybe Later
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInstall}
                    className="py-2.5 sm:py-3 px-4 bg-gradient-to-r from-brand-500 to-brand-400 text-white font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl hover:shadow-glow shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={16} className="sm:w-5 sm:h-5" />
                    <span>Install</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
