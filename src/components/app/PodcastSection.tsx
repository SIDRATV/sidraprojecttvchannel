"use client";

import { ContentSection } from '@/components/app/ContentSection';

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
      <div>
        <h2 className="text-2xl font-bold">Podcasts</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Talks, interviews and long-form audio</p>
      </div>

      <ContentSection title="Latest Podcasts" description="New episodes and series" items={items.map((i) => ({ id: i.id, title: i.title, image: i.image, duration: i.duration, category: i.category }))} type="horizontal" />
    </section>
  );
}
