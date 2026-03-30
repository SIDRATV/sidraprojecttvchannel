'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Video, Wallet, Crown, Gift, Tag, CheckCheck, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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

export default function NotificationsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const params = filter === 'unread' ? '?unread=true&limit=50' : '?limit=50';
      const res = await fetch(`/api/notifications${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [session?.access_token, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!session?.access_token) return;
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
    } catch {}
  };

  const markOneRead = async (id: string) => {
    if (!session?.access_token) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'video': return <Video size={18} className="text-brand-400" />;
      case 'wallet': return <Wallet size={18} className="text-emerald-400" />;
      case 'crown': return <Crown size={18} className="text-yellow-400" />;
      case 'gift': return <Gift size={18} className="text-pink-400" />;
      case 'tag': return <Tag size={18} className="text-orange-400" />;
      default: return <Bell size={18} className="text-brand-400" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `il y a ${days}j`;
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
            >
              <CheckCheck size={16} />
              Tout marquer comme lu
            </motion.button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                filter === f
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f === 'all' ? 'Toutes' : 'Non lues'}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Vos notifications apparaîtront ici
            </p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {notifications.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => {
                    if (!notif.read) markOneRead(notif.id);
                    if (notif.link) router.push(notif.link);
                  }}
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    !notif.read
                      ? 'bg-brand-50/60 dark:bg-brand-500/5 hover:bg-brand-50 dark:hover:bg-brand-500/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {getIcon(notif.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm ${!notif.read ? 'font-bold' : 'font-medium'} text-gray-950 dark:text-white`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
