"use client";

import { motion } from 'framer-motion';

interface EventItem {
  id: string;
  title: string;
  image?: string;
  date: string;
  location?: string;
  description?: string;
}

export function EventsSection({ items }: { items: EventItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Événements</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Conférences, meetups et lancements</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((ev) => (
          <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow">
            {ev.image && <img src={ev.image} alt={ev.title} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <div className="text-sm text-brand-500 font-semibold">{ev.date}</div>
              <h3 className="font-bold mt-2">{ev.title}</h3>
              {ev.location && <div className="text-sm text-gray-500 mt-1">{ev.location}</div>}
              {ev.description && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{ev.description}</p>}
              <div className="mt-3">
                <button className="px-4 py-2 bg-brand-500 text-white rounded-md">See details</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
