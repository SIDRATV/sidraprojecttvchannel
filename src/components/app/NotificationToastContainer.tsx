'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Video, Wallet, Crown, Gift, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  icon: string;
  link?: string;
  createdAt: number;
}

/** Dispatched by AppHeader when a realtime notification arrives */
export const TOAST_EVENT = 'sidra:toast-notification';

function NotifIcon({ icon }: { icon: string }) {
  const cls = 'flex-shrink-0';
  switch (icon) {
    case 'video':  return <Video  size={16} className={`${cls} text-brand-400`} />;
    case 'wallet': return <Wallet size={16} className={`${cls} text-emerald-400`} />;
    case 'crown':  return <Crown  size={16} className={`${cls} text-yellow-400`} />;
    case 'gift':   return <Gift   size={16} className={`${cls} text-pink-400`} />;
    case 'tag':    return <Tag    size={16} className={`${cls} text-orange-400`} />;
    default:       return <Bell   size={16} className={`${cls} text-brand-400`} />;
  }
}

const AUTO_DISMISS_MS = 5000;

export function NotificationToastContainer() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const router = useRouter();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for the custom event dispatched by AppHeader
  useEffect(() => {
    const handler = (e: Event) => {
      const notif = (e as CustomEvent<ToastNotification>).detail;
      setToasts((prev) => {
        // Deduplicate by id, cap at 5 visible toasts
        if (prev.some((t) => t.id === notif.id)) return prev;
        return [notif, ...prev].slice(0, 5);
      });
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  // Auto-dismiss individual toasts after AUTO_DISMISS_MS
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), AUTO_DISMISS_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-16 right-4 z-[300] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0,  scale: 1    }}
            exit={{   opacity: 0, x: 80, scale: 0.95  }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Progress bar — shows time left before auto-dismiss */}
            <motion.div
              className="h-0.5 bg-brand-500 origin-left"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
            />

            <div className="flex items-start gap-3 p-3">
              {/* Icon */}
              <div className="mt-0.5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <NotifIcon icon={toast.icon} />
              </div>

              {/* Content */}
              <button
                className="flex-1 min-w-0 text-left"
                onClick={() => {
                  if (toast.link) router.push(toast.link);
                  dismiss(toast.id);
                }}
              >
                <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                  {toast.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2 leading-tight">
                  {toast.message}
                </p>
              </button>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(toast.id)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                aria-label="Fermer"
              >
                <X size={14} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
