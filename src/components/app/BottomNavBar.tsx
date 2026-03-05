'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Compass,
  Mic2,
  Radio,
  Bookmark,
  Settings,
  User,
  Sparkles,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/premium', label: 'Premium', icon: Sparkles },
  { href: '/podcast', label: 'Podcast', icon: Mic2 },
  { href: '/live', label: 'Live', icon: Radio },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
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

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Navigation Items */}
          <div className="flex items-center space-x-2 flex-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              const isPremium = item.href === '/premium';

              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
                      isPremium
                        ? isActive
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 shadow-lg'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg'
                        : isActive
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-xs font-medium mt-1">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center justify-center w-16 h-16 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
            </motion.button>

            {/* Profile Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: profileOpen ? 1 : 0, y: profileOpen ? 0 : 10 }}
              transition={{ duration: 0.2 }}
              className={`absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden ${
                profileOpen ? 'block' : 'hidden pointer-events-none'
              }`}
            >
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-sm font-semibold text-gray-950 dark:text-white">Logged in as</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{user?.full_name || user?.email || 'User'}</p>
              </div>

              {/* Profile & Watchlist Links */}
              <div className="py-2">
                <Link href="/profile">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                </Link>
                <Link href="/watchlist">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm"
                  >
                    <Bookmark size={16} />
                    <span>Watchlist</span>
                  </button>
                </Link>
                <Link href="/settings">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                </Link>
              </div>

              {/* Logout Button */}
              <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleLogout();
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm font-medium"
                >
                  <span>Logout & Return to Home</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
