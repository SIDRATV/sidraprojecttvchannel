"use client";

import { motion } from 'framer-motion';

interface StartupItem {
  id: string;
  name: string;
  image?: string;
  pitch?: string;
  stage?: string;
  founders?: string;
}

export function StartupsSection({ items }: { items: StartupItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Startups</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Projets Sidra cherchant investissement</p>
        </div>
        <div>
          <button className="px-4 py-2 border rounded-md">Submit a project</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((s) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-white dark:bg-gray-900 shadow">
            {s.image && <img src={s.image} alt={s.name} className="w-full h-36 object-cover rounded" />}
            <div className="mt-3">
              <h3 className="font-bold">{s.name}</h3>
              {s.stage && <div className="text-sm text-gray-500">Stage: {s.stage}</div>}
              {s.founders && <div className="text-sm text-gray-500">Founders: {s.founders}</div>}
              {s.pitch && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{s.pitch}</p>}
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-2 bg-green-600 text-white rounded-md">Request Meeting</button>
                <button className="px-3 py-2 border rounded-md">Details</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
