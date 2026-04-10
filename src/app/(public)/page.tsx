'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Hero } from '@/components/Hero';
import { CategoryBrowser } from '@/components/CategoryBrowser';
import { RecentVideosSection } from '@/components/RecentVideosSection';
import { InspirationSection } from '@/components/InspirationSection';
import { NewsletterSection } from '@/components/NewsletterSection';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const sectionFade = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function HomePage() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  // Redirect authenticated users straight to the app
  useEffect(() => {
    if (initialized && user) {
      router.replace('/dashboard');
    }
  }, [initialized, user, router]);

  // Blank while auth is resolving (only blocks if a session exists in localStorage)
  if (!initialized && user) return null;

  return (
    <div className="bg-white dark:bg-gray-950 transition-colors" suppressHydrationWarning>
      {/* Hero Section */}
      <Hero />

      {/* Recent Videos — Main Section (login required to play) */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} style={{ overflow: 'visible' }}>
        <RecentVideosSection />
      </motion.div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
          <Sparkles size={14} className="text-gold-500/40" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        </div>
      </div>

      {/* Categories Section */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
        <CategoryBrowser />
      </motion.div>

      {/* Inspiration Section */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
        <InspirationSection />
      </motion.div>

      {/* Newsletter */}
      <motion.div variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
        <NewsletterSection />
      </motion.div>
    </div>
  );
}
