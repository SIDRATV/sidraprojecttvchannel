'use client';

import { motion } from 'framer-motion';
import { ContentCard } from '@/components/app/ContentCard';

interface ContentSectionProps {
  title: string;
  description?: string;
  items: {
    id: string;
    title: string;
    image: string;
    duration?: string;
    category?: string;
    rating?: number;
  }[];
  type?: 'vertical' | 'horizontal';
}

export function ContentSection({
  title,
  description,
  items,
  type = 'vertical',
}: ContentSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{title}</h2>
        {description && <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>}
      </div>

      <div
        className={`grid gap-4 ${
          type === 'horizontal'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        }`}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ContentCard {...item} type={type} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
