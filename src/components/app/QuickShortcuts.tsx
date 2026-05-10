'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Radio, Film, Tv, Dumbbell, Star, Baby, Grid3x3 } from 'lucide-react';

interface Shortcut {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  bgFrom: string;
  bgTo: string;
  pulse?: boolean;
}

const shortcuts: Shortcut[] = [
  {
    id: 'live',
    label: 'Chaînes Live',
    subtitle: 'En direct',
    href: '/live',
    icon: <Radio size={28} className="text-white" />,
    bgFrom: 'from-red-500',
    bgTo: 'to-rose-600',
    pulse: true,
  },
  {
    id: 'films',
    label: 'Films',
    subtitle: '10K+ films',
    href: '/premium-videos?category=films',
    icon: <Film size={28} className="text-white" />,
    bgFrom: 'from-purple-500',
    bgTo: 'to-indigo-600',
  },
  {
    id: 'series',
    label: 'Séries',
    subtitle: '2K+ séries',
    href: '/premium-videos?category=series',
    icon: <Tv size={28} className="text-white" />,
    bgFrom: 'from-blue-500',
    bgTo: 'to-cyan-600',
  },
  {
    id: 'sport',
    label: 'Sport',
    subtitle: 'En direct',
    href: '/premium-videos?category=sport',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M4.93 4.93c2.17 2.17 4.2 3.41 7.07 3.07s4.9-2.56 6.07-4.93M19.07 19.07c-2.17-2.17-4.2-3.41-7.07-3.07s-4.9 2.56-6.07 4.93" />
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
    bgFrom: 'from-emerald-500',
    bgTo: 'to-green-600',
  },
  {
    id: 'anime',
    label: 'Anime',
    subtitle: '+ titres',
    href: '/premium-videos?category=anime',
    icon: <Star size={28} className="text-white" fill="white" />,
    bgFrom: 'from-orange-500',
    bgTo: 'to-amber-600',
  },
  {
    id: 'enfants',
    label: 'Enfants',
    subtitle: 'Sûr & Fun',
    href: '/premium-videos?category=enfants',
    icon: <Baby size={28} className="text-white" />,
    bgFrom: 'from-yellow-400',
    bgTo: 'to-amber-500',
  },
  {
    id: 'all',
    label: 'Plus',
    subtitle: 'Voir tout',
    href: '/premium-videos',
    icon: <Grid3x3 size={28} className="text-white" />,
    bgFrom: 'from-gray-500',
    bgTo: 'to-gray-600',
  },
];

export function QuickShortcuts() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.id}
            href={shortcut.href}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Icon circle */}
            <div
              className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${shortcut.bgFrom} ${shortcut.bgTo} flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-200`}
            >
              {shortcut.pulse && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
              )}
              {shortcut.icon}
            </div>

            {/* Labels */}
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                {shortcut.label}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
                {shortcut.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
