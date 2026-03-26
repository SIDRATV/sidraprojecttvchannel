'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, TrendingUp, Users, Newspaper } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/explore/wallet', label: 'Wallet' },
  { href: '/explore/voting-project', label: 'Voting' },
  { href: '/explore/partenariat', label: 'Partners' },
  { href: '/explore/actualiter', label: 'News' },
];

export function ExploreNavBar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  const getIconComponent = (index: number) => {
    const icons = [Wallet, TrendingUp, Users, Newspaper];
    const Icon = icons[index];
    return Icon ? <Icon size={20} /> : null;
  };

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center h-16 gap-6">
          <Link href="/explore" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <span className="font-bold text-gray-950 dark:text-white hidden sm:inline">Explore</span>
          </Link>

          <div className="flex gap-1">
            {navItems.map((item, idx) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                  isActive(item.href)
                    ? 'text-brand-500 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {getIconComponent(idx)}
                <span className="hidden sm:inline">{item.label}</span>
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
