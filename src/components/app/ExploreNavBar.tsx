'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Handshake, Newspaper } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: '/explore/wallet',
    label: 'Wallet',
    icon: <Wallet size={20} />,
    description: 'Manage funds',
  },
  {
    href: '/explore/voting-project',
    label: 'Voting Projects',
    icon: <TrendingUp size={20} />,
    description: 'Vote on projects',
  },
  {
    href: '/explore/partenariat',
    label: 'Partners',
    icon: <Handshake size={20} />,
    description: 'Join partnerships',
  },
  {
    href: '/explore/actualiter',
    label: 'Actualités',
    icon: <Newspaper size={20} />,
    description: 'Latest news',
  },
];

export function ExploreNavBar() {
  const pathname = usePathname();

  const getActiveIndex = () => {
    return navItems.findIndex((item) => pathname.startsWith(item.href));
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-white dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20 overflow-x-auto">
          {/* Logo/Title */}
          <Link href="/explore" className="flex items-center gap-2 flex-shrink-0 mr-8 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <span className="font-bold text-gray-950 dark:text-white hidden sm:inline">Explore</span>
          </Link>

          {/* Navigation Items */}
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item, index) => {
              const isActive = getActiveIndex() === index;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex-shrink-0 group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'}>
                      {item.icon}
                    </span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </motion.div>

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="explore-nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                    />
                  )}

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                    <div className="bg-gray-950 dark:bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
