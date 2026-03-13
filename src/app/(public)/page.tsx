'use client';

import { motion } from 'framer-motion';
import { Hero } from '@/components/Hero';
import { CategoryBrowser } from '@/components/CategoryBrowser';
import { VideoGrid } from '@/components/VideoGrid';
import { InspirationSection } from '@/components/InspirationSection';
import { NewsletterSection } from '@/components/NewsletterSection';

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      suppressHydrationWarning
    >
      {/* Hero Section */}
      <Hero />

      {/* Categories Section */}
      <CategoryBrowser />

      {/* Featured Videos */}
      <VideoGrid
        title="Featured Content"
        featured
        limit={6}
      />

      {/* Inspiration Section */}
      <InspirationSection />

      {/* Popular Videos */}
      <VideoGrid
        title="Popular Now"
        limit={12}
      />

      {/* Newsletter */}
      <NewsletterSection />
    </motion.div>
  );
}
