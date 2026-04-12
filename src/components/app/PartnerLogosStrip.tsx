'use client';

import { useEffect, useRef, useState } from 'react';

interface Partner {
  id: string;
  name: string;
  logo_emoji: string;
  logo_url: string;
  status: string;
}

export function PartnerLogosStrip() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/partnerships')
      .then(r => r.json())
      .then(d => { if (d.partners?.length) setPartners(d.partners); })
      .catch(() => {});
  }, []);

  if (partners.length === 0) return null;

  // Duplicate list for seamless infinite scroll
  const items = [...partners, ...partners];

  return (
    <div className="w-full overflow-hidden py-3 border-y border-gray-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm">
      <div
        ref={trackRef}
        className="flex gap-8 items-center partner-scroll-track"
        style={{ width: 'max-content' }}
      >
        {items.map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="flex items-center gap-2.5 flex-shrink-0 select-none"
            title={p.name}
          >
            {p.logo_url ? (
              <img
                src={p.logo_url}
                alt={p.name}
                className="h-8 w-auto max-w-[80px] object-contain opacity-60 dark:opacity-40 hover:opacity-100 dark:hover:opacity-80 transition-opacity grayscale hover:grayscale-0"
                draggable={false}
              />
            ) : (
              <div className="h-8 px-3 flex items-center gap-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg border border-gray-200 dark:border-white/[0.08] opacity-70 hover:opacity-100 transition-opacity">
                <span className="text-base leading-none">{p.logo_emoji || '🤝'}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-slate-300 whitespace-nowrap">{p.name}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes partner-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .partner-scroll-track {
          animation: partner-scroll ${Math.max(20, partners.length * 4)}s linear infinite;
        }
        .partner-scroll-track:hover {
          animation-play-state: paused;
        }
      ` }} />
    </div>
  );
}
