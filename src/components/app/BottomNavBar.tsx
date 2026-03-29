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
  { href: '/premium', label: 'Premium', icon: Sparkles },
  { href: '/podcast', label: 'Podcast', icon: Mic2 },
  { href: '/live', label: 'Live', icon: Radio },
];

export function BottomNavBar() {
  const pathname = usePathname();

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
              const isPremium = item.href === '/premium' || item.href === '/premium-videos';

              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
                      isPremium
                        ? isActive
                          ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-gray-900 shadow-lg shadow-gold-500/30'
                          : 'bg-gradient-to-r from-gold-500 to-gold-300 text-gray-900 hover:shadow-lg hover:shadow-gold-500/30'
                        : isActive
                        ? 'bg-brand-500/10 dark:bg-brand-400/15 text-brand-500 dark:text-white'
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
        </div>
      </div>
    </motion.nav>
  );
}
