'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Moon, Sun, User, LogOut, Settings, Bookmark, Video, Wallet, Crown, Gift, Tag, CheckCheck } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/providers/ProfileProvider';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface AppHeaderProps {
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export function AppHeader({ onSearch, showSearch = false }: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, session } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Real notifications from DB
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }, [session?.access_token]);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!session?.access_token || unreadCount === 0) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

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
    try {
      await authService.signOut();
      localStorage.removeItem('user');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-colors"
    >
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative w-12 h-12 flex-shrink-0"
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
            <h1 className="font-bold text-lg text-gray-950 dark:text-white">Sidra</h1>
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
              {(profile?.profilePhoto || user?.avatar_url) ? (
                <img
                  src={profile?.profilePhoto || user?.avatar_url || ''}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-white" />
                </div>
              )}
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
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
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
                        <Bookmark size={16} />
                        <span>Watchlist</span>
                      </button>
                    </Link>
                    <Link href="/settings">
                      <button
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                    </Link>
                  </div>

                  {/* Logout Button */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleLogout();
                        setProfileOpen(false);
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

      {/* Search Bar - Bottom Section */}
      {showSearch && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 lg:px-8 py-3 bg-gray-50 dark:bg-gray-800/50 transition-colors">
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
    </motion.header>
  );
}
