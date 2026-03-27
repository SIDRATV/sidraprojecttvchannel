'use client';

import Image from 'next/image';
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
  Film,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/premium', label: 'Premium', icon: Sparkles },
  { href: '/premium-videos', label: 'Videos', icon: Film },
  { href: '/podcast', label: 'Podcast', icon: Mic2 },
  { href: '/live', label: 'Live', icon: Radio },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-8 border-b border-gray-200/50 dark:border-gray-800/50 transition-colors">
        <Link href="/dashboard">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/sidra-logo.webp"
                alt="Sidra Logo"
                fill
                className="object-contain drop-shadow-md"
                priority
              />
            </div>
            <div>
              <h1 className="font-bold text-lg">Sidra</h1>
              <p className="text-xs text-brand-500 dark:text-brand-400 font-medium">TV Channel</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          const isPremium = item.href === '/premium' || item.href === '/premium-videos';

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isPremium
                    ? isActive
                      ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-gray-900 shadow-lg shadow-gold-500/30'
                      : 'bg-gradient-to-r from-gold-500 to-gold-300 text-gray-900 hover:shadow-lg hover:shadow-gold-500/30'
                    : isActive
                    ? 'bg-brand-500/10 dark:bg-brand-400/15 text-brand-600 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                {(isActive || isPremium) && !isPremium && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl bg-brand-500/10 dark:bg-brand-400/15 -z-10"
                  />
                )}
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
                {isPremium && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-gold-700/30 rounded-full">
                    Pro
                  </span>
                )}
                {isActive && !isPremium && (
                  <motion.div
                    className="ml-auto w-1 h-6 bg-gradient-to-b from-brand-500 to-brand-400 rounded-full"
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
        className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-800/50 h-screen sticky top-0 transition-colors"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Menu Button & Drawer */}
      <div className="lg:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-100 dark:bg-gray-800 rounded-xl lg:hidden transition-colors"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: mobileOpen ? 1 : 0, x: mobileOpen ? 0 : -300 }}
          transition={{ duration: 0.3 }}
          className={`fixed inset-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-800/50 overflow-y-auto transition-colors ${
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
