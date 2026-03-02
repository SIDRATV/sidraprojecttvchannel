"use client";

import { ContentSection } from '@/components/app/ContentSection';
import { motion } from 'framer-motion';

interface LiveItem {
  id: string;
  title: string;
  image: string;
  viewers?: string;
  category?: string;
}

export function LiveSection({ items }: { items: LiveItem[] }) {
  if (!items || items.length === 0) return null;

  const [main, ...rest] = items;

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main live hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex-1 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5"
        >
          <img src={main.image} alt={main.title} className="w-full h-64 object-cover" />
          <div className="p-4">
            <div className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold">LIVE</div>
            <h3 className="text-2xl font-bold mt-3">{main.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{main.category} • {main.viewers ?? '—'} viewers</p>
          </div>
        </motion.div>

        {/* Side list of other live streams */}
        <div className="w-full lg:w-80 space-y-3">
          <h3 className="text-lg font-semibold">Other Live Now</h3>
          {rest.map((it) => (
            <div key={it.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900">
              <img src={it.image} alt={it.title} className="w-16 h-10 object-cover rounded" />
              <div className="flex-1">
                <div className="text-sm font-medium">{it.title}</div>
                <div className="text-xs text-gray-500">{it.viewers ?? '—'} viewers</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal carousel-like grid for more live content */}
      <ContentSection title="Live Channels" description="Currently streaming live" items={items.map((i) => ({ id: i.id, title: i.title, image: i.image, duration: 'LIVE', category: i.category }))} type="horizontal" />
    </section>
  );
}
