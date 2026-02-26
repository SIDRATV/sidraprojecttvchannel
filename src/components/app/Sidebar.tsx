'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Compass,
  Bookmark,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      localStorage.removeItem('user');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <Link href="/dashboard">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center font-bold text-white">
              S
            </div>
            <div>
              <h1 className="font-bold text-lg">Sidra</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">TV Channel</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-purple-200 dark:bg-purple-500/20 -z-10"
                  />
                )}
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="ml-auto w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-6 space-y-4 transition-colors">
        <div className="px-2 py-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Logged in as</p>
          <p className="font-semibold text-sm text-gray-950 dark:text-white truncate">{user?.full_name || user?.email || 'User'}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </motion.button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 transition-colors"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Menu Button & Drawer */}
      <div className="lg:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-200 dark:bg-gray-800 rounded-lg lg:hidden transition-colors"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: mobileOpen ? 1 : 0, x: mobileOpen ? 0 : -300 }}
          transition={{ duration: 0.3 }}
          className={`fixed inset-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-colors ${
            mobileOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex flex-col h-screen">
            <div onClick={() => setMobileOpen(false)}>{sidebarContent}</div>
          </div>
        </motion.div>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </div>
    </>
  );
}
