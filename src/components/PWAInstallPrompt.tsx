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
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    // Log initial page load
    console.log('[PWA] PWAInstallPrompt component mounted');
    
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('[PWA] Standalone mode:', isStandalone);
    
    if (isStandalone) {
      console.log('[PWA] App is already installed (standalone mode)');
      setIsInstalled(true);
      return;
    }
    
    // App is not installed - clear any old dismissal data
    console.log('[PWA] App not in standalone mode, clearing all PWA data...');
    localStorage.removeItem('pwaPromptTime');
    try {
      sessionStorage.removeItem('pwaPromptTime');
    } catch (e) {
      // sessionStorage may not be available
    }
    
    // Force unregister all service workers to make the browser re-evaluate PWA installability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log('[PWA] Found', registrations.length, 'service worker(s)');
        
        // Clean all registrations and let browser re-validate
        for (let reg of registrations) {
          console.log('[PWA] Unregistering SW at scope:', reg.scope);
          reg.unregister().then(() => {
            console.log('[PWA] SW unregistered, browser will re-evaluate PWA status');
            // Add delay and re-register
            setTimeout(() => {
              navigator.serviceWorker.register('/sw.js', { 
                scope: '/',
                updateViaCache: 'none' 
              }).then((reg) => {
                console.log('[PWA] SW re-registered with fresh scope');
              }).catch(err => {
                console.error('[PWA] SW re-registration failed:', err);
              });
            }, 500);
          });
        }
      }).catch(err => {
        console.error('[PWA] Error getting SW registrations:', err);
      });
    }
    
    // Fetch manifest to verify it's valid
    fetch('/manifest.json?cache-bust=' + Date.now())
      .then(r => {
        console.log('[PWA] Manifest HTTP status:', r.status);
        return r.json();
      })
      .then(manifest => {
        console.log('[PWA] Manifest is valid:', {
          name: manifest.name,
          display: manifest.display,
          start_url: manifest.start_url,
          icons: manifest.icons?.length
        });
      })
      .catch(e => {
        console.error('[PWA] Manifest fetch error:', e);
      });

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] ✅ beforeinstallprompt event CAPTURED!');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Log that we're listening
    console.log('[PWA] 👂 Listening for beforeinstallprompt event...');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Set debug mode after 3 seconds to show issue
    const debugTimer = setTimeout(() => {
      if (!deferredPrompt) {
        console.warn('[PWA] ⚠️ WARNING: beforeinstallprompt event was NOT triggered after 3 seconds');
        console.warn('[PWA] This may be normal on localhost or HTTP sites');
        console.warn('[PWA] On production HTTPS, go to DevTools > Application > Manifest to check PWA requirements');
        setDebugMode(true);
      }
    }, 3000);

    // Check for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] ✅ App installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem('pwaPromptTime');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(debugTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

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

  // If no deferredPrompt, show diagnostic info in debug mode
  if (!deferredPrompt) {
    if (debugMode) {
      return (
        <div className="fixed bottom-20 right-4 z-50 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg max-w-xs">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ⚠️ <strong>PWA Issue:</strong> Install prompt not detected.
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
            Check browser console for details. The app may need HTTPS or there could be a manifest issue.
          </p>
          <button
            onClick={() => {
              console.log('[PWA] Manifest check:', fetch('/manifest.json').then(r => r.json()));
              console.log('[PWA] Service workers:', navigator.serviceWorker?.getRegistrations());
            }}
            className="text-xs mt-2 px-2 py-1 bg-yellow-200 dark:bg-yellow-700 rounded hover:bg-yellow-300 dark:hover:bg-yellow-600"
          >
            Check Manifest
          </button>
        </div>
      );
    }
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
