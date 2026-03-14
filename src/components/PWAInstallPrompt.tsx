'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Store this in a ref to track state across renders
  const [eventCaptured, setEventCaptured] = useState(false);

  useEffect(() => {
    console.group('[PWA] Component Mount');
    console.log('%c[PWA] PWAInstallPrompt component mounted', 'color: blue; font-weight: bold;');
    
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('%c[PWA] Standalone mode:', isStandalone, 'color: orange');
    
    if (isStandalone) {
      console.log('%c[PWA] ✅ App is already installed in standalone mode', 'color: green; font-weight: bold;');
      setIsInstalled(true);
      console.groupEnd();
      return;
    }
    
    console.log('%c[PWA] 📱 App NOT in standalone - clearing cache and setting up listeners', 'color: purple');
    
    // Clear any old dismissal data
    localStorage.removeItem('pwaPromptTime');
    sessionStorage.removeItem('pwaPromptTime');

    // Listen for beforeinstallprompt event - this is the main event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('%c[PWA] ✅✅✅ beforeinstallprompt EVENT CAPTURED!', 'color: green; font-size: 16px; font-weight: bold;');
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setEventCaptured(true);
      setShowPrompt(true);
    };

    // Register the listener immediately
    console.log('%c[PWA] 👂 Registering beforeinstallprompt listener...', 'color: blue');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also set up app installed listener
    const handleAppInstalled = () => {
      console.log('%c[PWA] 🎉 App installed successfully!', 'color: green; font-size: 14px; font-weight: bold;');
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem('pwaPromptTime');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    console.groupEnd();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [eventCaptured, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted installation');
        setIsInstalled(true);
        localStorage.removeItem('pwaPromptTime');
      } else {
        console.log('[PWA] User dismissed installation');
        // Remember when prompt was dismissed for 7 days
        localStorage.setItem('pwaPromptTime', Date.now().toString());
      }
    } catch (error) {
      console.error('[PWA] Installation error:', error);
    }
    
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    console.log('[PWA] User dismissed install prompt');
    setShowPrompt(false);
    // Remember user's choice for 7 days
    localStorage.setItem('pwaPromptTime', Date.now().toString());
  };

  if (isInstalled) {
    return null;
  }

  // If no deferredPrompt, don't show anything
  if (!deferredPrompt) {
    return null;
  }

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
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-blue-200 dark:border-blue-500/30 p-6 sm:p-8 w-full max-w-md">
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 hover:bg-blue-200 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
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
                      src="/sidra-logo.png"
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
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-950 dark:text-white text-xs sm:text-sm">Offline Access</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Watch content anytime, anywhere</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-950 dark:text-white text-xs sm:text-sm">App Experience</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Native app feel without the app store</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                    className="py-2.5 sm:py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all flex items-center justify-center gap-2"
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
