'use client';

import { motion } from 'framer-motion';
import { YouTubeFeaturedCarousel } from '@/components/app/YouTubeFeaturedCarousel';
import { YouTubeSection } from '@/components/app/YouTubeSection';
import { PodcastSection } from '@/components/app/PodcastSection';
import { EventsSection } from '@/components/app/EventsSection';
import { PremiumBanner } from '@/components/premium';

export default function DashboardPage() {
  // Mock data for enhanced dashboard sections
  const podcastItems = [
    { id: 'p1', title: 'Sidra Conversations S1E1', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop', duration: '56:12', category: 'Interview' },
    { id: 'p2', title: 'Tech & Society Episode 3', image: 'https://images.unsplash.com/photo-1553531088-e914c4e3ee3d?w=400&h=600&fit=crop', duration: '42:05', category: 'Panel' },
    { id: 'p3', title: 'Investing with Values', image: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=600&fit=crop', duration: '48:00', category: 'Finance' },
  ];

  const events = [
    { id: 'e1', title: 'Sidra Summit 2026', image: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=1200&h=800&fit=crop', date: 'May 12, 2026', location: 'Casablanca', description: 'Join industry leaders and founders for two days of talks and networking.' },
    { id: 'e2', title: 'Startup Pitch Night', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&h=800&fit=crop', date: 'Apr 3, 2026', location: 'Online', description: 'Selected startups present to invited investors.' },
    { id: 'e3', title: 'Community Meetup', image: '', date: 'Jun 20, 2026', location: 'Rabat', description: 'Local chapters meet to collaborate on projects.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-4 md:p-8 bg-white dark:bg-gray-950 min-h-screen transition-colors"
    >
      {/* Premium Banner - Shows if user has unlocked a plan */}
      <PremiumBanner />

      {/* Featured Videos from YouTube API - Auto-rotates every 7 seconds */}
      <YouTubeFeaturedCarousel
        query="technology innovation trending"
        maxResults={5}
      />

      {/* Podcasts Section */}
      <PodcastSection items={podcastItems} />

      {/* Events Section */}
      <EventsSection items={events} />

      {/* Educational Videos */}
      <YouTubeSection
        title="Educational Content"
        description="Learn new skills and concepts"
        query="education tutorial learning"
        maxResults={12}
      />

      {/* Business & Entrepreneurship */}
      <YouTubeSection
        title="Business & Entrepreneurship"
        description="Insights for founders and business leaders"
        query="startup business entrepreneurship investor"
        maxResults={12}
      />

      {/* Trending Now */}
      <YouTubeSection
        title="Trending Now"
        description="What's popular this week"
        query="trending viral"
        maxResults={12}
      />

      {/* Technology Deep Dives */}
      <YouTubeSection
        title="Technology Deep Dives"
        description="In-depth explorations of tech topics"
        query="blockchain cryptocurrency AI machine learning"
        maxResults={12}
      />

      {/* Community & Culture */}
      <YouTubeSection
        title="Community & Culture"
        description="Stories that inspire and unite"
        query="community culture inspiration"
        maxResults={8}
      />
    </motion.div>
  );
}
