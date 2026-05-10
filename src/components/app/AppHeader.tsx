'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Moon, Sun, User, LogOut, Settings, Bookmark, Video, Wallet, Crown, Gift, Tag, CheckCheck, Loader2, Download, History, Play } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/providers/ProfileProvider';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/queries/useNotifications';
import type { Notification } from '@/hooks/queries/useNotifications';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { TOAST_EVENT } from '@/components/app/NotificationToastContainer';

interface AppHeaderProps {
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export function AppHeader({ onSearch, showSearch = false }: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, session } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { playSound, showBrowserNotification } = useNotificationSound();
  const { isInstallable, installApp } = usePWAInstall();
  const { history: watchHistory } = useWatchHistory();

  // Crown badge: user has an active premium plan
  const isPremium = !!(user?.premium_plan &&
    user.premium_plan !== 'free' &&
    (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date()));

  // Notifications via React Query (cache 15s, poll 60s, refetch on focus)
  const {
    notifications,
    unreadCount,
    markAllRead,
    addRealtimeNotification,
  } = useNotifications();

  const previousUnreadCount = useRef<number | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);

  // Initialize previousUnreadCount once notifications data is loaded.
  // Without this, the FIRST real-time notification is always skipped because
  // previousUnreadCount.current starts as null and the guard `!== null` fails.
  useEffect(() => {
    if (previousUnreadCount.current === null && unreadCount !== undefined) {
      previousUnreadCount.current = unreadCount;
    }
  }, [unreadCount]);

  // Track permission state on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setNotifPermission(Notification.permission);
  }, []);

  // Auto-request permission when user logs in (works on desktop + most mobile browsers)
  // The button below is a fallback for Android Chrome strict gesture requirement
  useEffect(() => {
    if (!user?.id) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    Notification.requestPermission()
      .then((result) => setNotifPermission(result))
      .catch(() => {});
  }, [user?.id]);

  // Manual request — for when auto-request was blocked by browser gesture policy
  const requestNotifPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
    } catch {}
  }, []);

  // Supabase Realtime: subscribe to new notifications for this user
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications_header_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          // Mise à jour du cache React Query directement — pas de re-fetch
          addRealtimeNotification(newNotif);
          // Son + notification navigateur + toast in-app
          if (previousUnreadCount.current !== null) {
            playSound();
            showBrowserNotification(newNotif.title, {
              body: newNotif.message,
              tag: `notification-${newNotif.id}`,
              link: newNotif.link || '/',
            });
            // Toast in-app visible immédiatement sur l'écran
            window.dispatchEvent(
              new CustomEvent(TOAST_EVENT, {
                detail: {
                  id: newNotif.id,
                  title: newNotif.title,
                  message: newNotif.message,
                  icon: newNotif.icon,
                  link: newNotif.link || '/',
                  createdAt: Date.now(),
                },
              })
            );
          }
          previousUnreadCount.current = (previousUnreadCount.current ?? 0) + 1;
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, playSound, showBrowserNotification, addRealtimeNotification]);

  const getNotifIcon = (icon: string) => {
    switch (icon) {
      case 'video': return <Video size={14} className="text-brand-400" />;
      case 'wallet': return <Wallet size={14} className="text-emerald-400" />;
      case 'crown': return <Crown size={14} className="text-yellow-400" />;
      case 'gift': return <Gift size={14} className="text-pink-400" />;
      case 'tag': return <Tag size={14} className="text-orange-400" />;
      default: return <Bell size={14} className="text-brand-400" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `il y a ${days}j`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.signOut();
      localStorage.removeItem('user');
      setShowLogoutConfirm(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <>
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-colors"
    >
      <div className="flex items-center justify-between px-4 lg:px-8 py-2">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative w-9 h-9 flex-shrink-0"
          >
            <Image
              src="/sidra-logo.webp"
              alt="Sidra Logo"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
          <div>
            <h1 className="font-bold text-base text-gray-950 dark:text-white">Sidra</h1>
            <p className="text-xs text-brand-500 dark:text-brand-400 font-medium">TV Channel</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Notifications Dropdown */}
          <div className="relative overflow-visible" ref={notificationRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {/* Notification Dropdown Menu */}
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-950 dark:text-white">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {notifPermission === 'default' && (
                        <button
                          onClick={requestNotifPermission}
                          title="Activer les notifications système"
                          className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors"
                        >
                          <Bell size={13} />
                          Activer
                        </button>
                      )}
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-400 font-medium transition-colors"
                        >
                          <CheckCheck size={14} />
                          Tout lire
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell size={24} className="mx-auto text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <motion.div
                          key={notif.id}
                          whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                          onClick={() => {
                            if (notif.link) router.push(notif.link);
                            setNotificationsOpen(false);
                          }}
                          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                            !notif.read ? 'bg-brand-50/50 dark:bg-brand-400/5' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="mt-1 flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              {getNotifIcon(notif.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-950 dark:text-white truncate">{notif.title}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{timeAgo(notif.created_at)}</p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-900/50">
                    <Link href="/notifications" onClick={() => setNotificationsOpen(false)}>
                      <button className="w-full text-center text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 font-medium py-1 transition-colors">
                        Voir tout
                      </button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
          >
            {isDark ? (
              <Sun size={20} className="text-gold-400" />
            ) : (
              <Moon size={20} />
            )}
          </motion.button>

          {/* Profile Dropdown */}
          <div className="relative overflow-visible" ref={profileRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="relative flex-shrink-0">
                {(profile?.profilePhoto || user?.avatar_url) ? (
                  <img
                    src={profile?.profilePhoto || user?.avatar_url || ''}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                )}
                {isPremium && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md ring-1 ring-white dark:ring-gray-900">
                    <Crown size={9} className="text-white" fill="currentColor" />
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs text-gray-600 dark:text-gray-400">Account</p>
                <p className="text-sm font-semibold text-gray-950 dark:text-white">{profile?.fullName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'User'}</p>
              </div>
            </motion.button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
                >
                  {/* User Info */}
                  <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                      {(profile?.profilePhoto || user?.avatar_url) ? (
                        <img
                          src={profile?.profilePhoto || user?.avatar_url || ''}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center flex-shrink-0">
                          <User size={20} className="text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Logged in as</p>
                        <p className="text-sm font-semibold text-gray-950 dark:text-white mt-1">{profile?.fullName || user?.full_name || user?.email || 'User'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link href="/profile">
                      <button
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm"
                      >
                        <User size={16} />
                        <span>Profile</span>
                      </button>
                    </Link>
                    <Link href="/watchlist">
                      <button
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm"
                      >
                        <History size={16} />
                        <span>Récemment regardés</span>
                      </button>
                    </Link>

                    {/* Compact watch history preview (last 3 videos) */}
                    {watchHistory.length > 0 && (
                      <div className="px-3 pb-2 space-y-1.5">
                        {watchHistory.slice(0, 3).map((item) => (
                          <Link
                            key={item.id}
                            href={item.videoId ? '#' : `/watch/${item.id}`}
                            onClick={(e) => {
                              setProfileOpen(false);
                              if (item.videoId) e.preventDefault(); // handled by modal on watchlist page
                            }}
                          >
                            <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer">
                              {/* Tiny thumbnail */}
                              <div className="relative w-14 h-9 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play size={10} fill="currentColor" className="text-white" />
                                </div>
                              </div>
                              {/* Title + time */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">
                                  {item.title}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {(() => {
                                    const diff = Date.now() - item.watchedAt;
                                    const mins = Math.floor(diff / 60_000);
                                    if (mins < 1) return "à l'instant";
                                    if (mins < 60) return `il y a ${mins}min`;
                                    const hrs = Math.floor(mins / 60);
                                    return `il y a ${hrs}h`;
                                  })()}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                        {watchHistory.length > 3 && (
                          <Link href="/watchlist" onClick={() => setProfileOpen(false)}>
                            <p className="text-[11px] text-brand-500 hover:text-brand-400 text-right pr-1 transition-colors">
                              +{watchHistory.length - 3} de plus →
                            </p>
                          </Link>
                        )}
                      </div>
                    )}
                    <Link href="/settings">
                      <button
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                    </Link>

                    {/* Install App Button - Only show if installable */}
                    {isInstallable && (
                      <button
                        onClick={() => {
                          installApp();
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors text-sm font-medium"
                      >
                        <Download size={16} />
                        <span>Installer l'app</span>
                      </button>
                    )}
                  </div>

                  {/* Logout Button */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setProfileOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm font-medium rounded-lg"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* (logout modal moved outside header) */}
    </motion.header>

    {/* Logout Confirmation Modal — outside motion.header to avoid transform stacking context */}
    <AnimatePresence>
      {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
            onClick={() => { if (!isLoggingOut) setShowLogoutConfirm(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <LogOut size={28} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-2">Déconnexion</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Voulez-vous vraiment vous déconnecter ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={isLoggingOut}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {isLoggingOut ? (
                      <><Loader2 size={16} className="animate-spin" /> En cours...</>
                    ) : (
                      <><LogOut size={16} /> Déconnecter</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
      )}
    </AnimatePresence>

    {/* Search Bar - Bottom Section */}
    {showSearch && (
      <div className="sticky top-0 z-49 border-t border-gray-200 dark:border-gray-800 px-4 lg:px-8 py-3 bg-gray-50 dark:bg-gray-800/50 transition-colors">
        <form onSubmit={handleSearch} className="max-w-7xl mx-auto">
          <motion.div whileFocus={{ scale: 1.01 }} className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos, channels, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/50 transition-all"
            />
          </motion.div>
        </form>
      </div>
    )}
    </>
  );
}
