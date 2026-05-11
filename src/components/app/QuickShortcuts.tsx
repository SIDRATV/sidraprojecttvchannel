'use client';

import Link from 'next/link';
import { useRef } from 'react';

interface Shortcut {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  bgFrom: string;
  bgTo: string;
  glowColor: string;
  pulse?: boolean;
}

/* ─── Professional animated SVG icons ─── */

const LiveIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* Pulsing wifi-style broadcast */}
    <circle cx="12" cy="15" r="2" fill="white" />
    <path d="M8.5 11.5a5 5 0 0 1 7 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" className="animate-[dash_1.5s_ease-in-out_infinite]" />
    <path d="M5.5 8.5a9 9 0 0 1 13 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
    <style>{`@keyframes dash{0%,100%{stroke-dashoffset:0;opacity:1}50%{stroke-dashoffset:20;opacity:0.3}}`}</style>
  </svg>
);

const FilmIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* Film reel */}
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="1.8" fill="none" />
    <path d="M2 9h20M2 15h20" stroke="white" strokeWidth="1.5" />
    <rect x="6" y="7" width="2" height="2" rx="0.5" fill="white" />
    <rect x="11" y="7" width="2" height="2" rx="0.5" fill="white" />
    <rect x="16" y="7" width="2" height="2" rx="0.5" fill="white" />
    <rect x="6" y="15" width="2" height="2" rx="0.5" fill="white" />
    <rect x="11" y="15" width="2" height="2" rx="0.5" fill="white" />
    <rect x="16" y="15" width="2" height="2" rx="0.5" fill="white" />
    {/* Play triangle */}
    <path d="M10 11.5l4 0.5-4 0.5z" fill="white" opacity="0.9" />
  </svg>
);

const SeriesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* Monitor + play */}
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="white" strokeWidth="1.8" fill="none" />
    <path d="M8 21h8M12 17v4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 9.5l5 2.5-5 2.5z" fill="white" />
  </svg>
);

const SportIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* Soccer ball */}
    <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.8" fill="none" />
    <path d="M12 2.5l2.5 3.5-2.5 2-2.5-2z" stroke="white" strokeWidth="1.3" fill="white" fillOpacity="0.5" />
    <path d="M21 8.5l-3.5 1.5-1-3.5" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M3 8.5l3.5 1.5 1-3.5" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M6 19.5l1.5-3.5 3.5 1V21" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M18 19.5l-1.5-3.5-3.5 1V21" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M9.5 8l2.5 1.5L14.5 8M12 9.5v4.5M9.5 16l2.5-2 2.5 2" stroke="white" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

const AnimeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* Stylized star / sparkle with sakura feel */}
    <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.3L12 16.5l-6.2 4.5 2.4-7.3L2 9.2h7.6z"
      stroke="white" strokeWidth="1.6" fill="white" fillOpacity="0.25" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2" fill="white" />
  </svg>
);

const KidsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* Smiley face in balloon */}
    <circle cx="12" cy="10" r="7.5" stroke="white" strokeWidth="1.8" fill="none" />
    <path d="M12 17.5l-1 3.5h2l-1-3.5z" fill="white" />
    {/* smile */}
    <path d="M9.5 11.5a2.5 2.5 0 0 0 5 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* eyes */}
    <circle cx="10" cy="9" r="1" fill="white" />
    <circle cx="14" cy="9" r="1" fill="white" />
  </svg>
);

const AllIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* 3×3 grid with animated center */}
    <rect x="3" y="3" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.9" />
    <rect x="9.5" y="3" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.7" />
    <rect x="16" y="3" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.5" />
    <rect x="3" y="9.5" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.7" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1.2" fill="white" />
    <rect x="16" y="9.5" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.7" />
    <rect x="3" y="16" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.5" />
    <rect x="9.5" y="16" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.7" />
    <rect x="16" y="16" width="5" height="5" rx="1.2" fill="white" fillOpacity="0.9" />
  </svg>
);

const shortcuts: Shortcut[] = [
  {
    id: 'live',
    label: 'Chaînes Live',
    subtitle: 'En direct',
    href: '/live',
    icon: <LiveIcon />,
    bgFrom: 'from-red-500',
    bgTo: 'to-rose-600',
    glowColor: 'shadow-red-500/40',
    pulse: true,
  },
  {
    id: 'films',
    label: 'Films',
    subtitle: '10K+ films',
    href: '/premium-videos?category=films',
    icon: <FilmIcon />,
    bgFrom: 'from-purple-500',
    bgTo: 'to-indigo-600',
    glowColor: 'shadow-purple-500/40',
  },
  {
    id: 'series',
    label: 'Séries',
    subtitle: '2K+ séries',
    href: '/premium-videos?category=series',
    icon: <SeriesIcon />,
    bgFrom: 'from-blue-500',
    bgTo: 'to-cyan-600',
    glowColor: 'shadow-blue-500/40',
  },
  {
    id: 'sport',
    label: 'Sport',
    subtitle: 'En direct',
    href: '/premium-videos?category=sport',
    icon: <SportIcon />,
    bgFrom: 'from-emerald-500',
    bgTo: 'to-green-600',
    glowColor: 'shadow-emerald-500/40',
  },
  {
    id: 'anime',
    label: 'Anime',
    subtitle: '+ titres',
    href: '/premium-videos?category=anime',
    icon: <AnimeIcon />,
    bgFrom: 'from-orange-500',
    bgTo: 'to-amber-600',
    glowColor: 'shadow-orange-500/40',
  },
  {
    id: 'enfants',
    label: 'Enfants',
    subtitle: 'Sûr & Fun',
    href: '/premium-videos?category=enfants',
    icon: <KidsIcon />,
    bgFrom: 'from-yellow-400',
    bgTo: 'to-amber-500',
    glowColor: 'shadow-yellow-400/40',
  },
  {
    id: 'all',
    label: 'Plus',
    subtitle: 'Voir tout',
    href: '/premium-videos',
    icon: <AllIcon />,
    bgFrom: 'from-slate-500',
    bgTo: 'to-slate-600',
    glowColor: 'shadow-slate-500/40',
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
            className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Icon circle */}
            <div
              className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${shortcut.bgFrom} ${shortcut.bgTo} flex items-center justify-center shadow-lg ${shortcut.glowColor} group-hover:scale-110 group-hover:shadow-xl group-active:scale-95 transition-all duration-200`}
            >
              {/* Shine overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

              {/* Live pulse dot */}
              {shortcut.pulse && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
              )}

              {shortcut.icon}
            </div>

            {/* Labels */}
            <div className="text-center">
              <p className="text-[11px] font-semibold text-gray-900 dark:text-white leading-tight">
                {shortcut.label}
              </p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
                {shortcut.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

