'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Compass,
  Mic2,
  Radio,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/podcast', label: 'Podcast', icon: Mic2 },
  { href: '/premium', label: 'Premium', icon: Sparkles },
  { href: '/live', label: 'Live', icon: Radio },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <Link href="/dashboard">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
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
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-blue-200 dark:bg-blue-500/20 -z-10"
                  />
                )}
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="ml-auto w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
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
