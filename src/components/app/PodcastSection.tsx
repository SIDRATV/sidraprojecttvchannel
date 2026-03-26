"use client";

import Link from 'next/link';
import { ContentSection } from '@/components/app/ContentSection';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface PodcastItem {
  id: string;
  title: string;
  image: string;
  duration?: string;
  category?: string;
}

export function PodcastSection({ items }: { items: PodcastItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Podcasts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Talks, interviews and long-form audio</p>
        </div>
        <Link href="/podcast">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
          >
            View All
            <ArrowRight size={16} />
          </motion.button>
        </Link>
      </div>

      <ContentSection title="Latest Podcasts" description="New episodes and series" items={items.map((i) => ({ id: i.id, title: i.title, image: i.image, duration: i.duration, category: i.category }))} type="horizontal" />
    </section>
  );
}
