'use client';

import { motion } from 'framer-motion';
import { FeaturedVideo } from '@/components/app/FeaturedVideo';
import { ContentSection } from '@/components/app/ContentSection';

// Mock data - In production, this would come from your API/database
const featuredVideos = [
  {
    title: 'The Legacy of Innovation',
    description:
      'Explore the journey of technological advancement within the Sidra ecosystem and its transformative impact on the Islamic community.',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&h=600&fit=crop',
    category: 'Documentary',
    rating: 9.2,
    videoId: '1',
  },
  {
    title: 'Understanding Blockchain Technology',
    description:
      'Deep dive into blockchain technology and how it revolutionizes financial systems in the modern world.',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop',
    category: 'Tutorial',
    rating: 8.8,
    videoId: '2',
  },
  {
    title: 'Community Impact Stories',
    description:
      'Inspiring stories of how communities leverage technology for positive social change and development.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop',
    category: 'Documentary',
    rating: 9.0,
    videoId: '3',
  },
  {
    title: 'Future of Islamic Finance',
    description:
      'Exploring the intersection of Islamic principles and modern financial innovation in the digital age.',
    image: 'https://images.unsplash.com/photo-1542744173-8e90f7e3912d?w=1200&h=600&fit=crop',
    category: 'Finance',
    rating: 8.5,
    videoId: '4',
  },
];

const recentlyWatched = [
  {
    id: '2',
    title: 'Understanding Blockchain Technology',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop',
    duration: '48:23',
    category: 'Tutorial',
  },
  {
    id: '3',
    title: 'Community Impact Stories',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop',
    duration: '52:15',
    category: 'Documentary',
  },
  {
    id: '4',
    title: 'Future of Islamic Finance',
    image: 'https://images.unsplash.com/photo-1542744173-8e90f7e3912d?w=400&h=600&fit=crop',
    duration: '45:30',
    category: 'Finance',
  },
  {
    id: '5',
    title: 'Technology & Society',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop',
    duration: '38:45',
    category: 'Lecture',
  },
  {
    id: '6',
    title: 'Digital Transformation',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop',
    duration: '41:20',
    category: 'Workshop',
  },
];

const recommendations = [
  {
    id: '7',
    title: 'Sustainable Development Goals',
    image: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=600&fit=crop',
    duration: '38:12',
    category: 'Documentary',
  },
  {
    id: '8',
    title: 'Art in the Digital Age',
    image: 'https://images.unsplash.com/photo-1577720643272-265e434ff3a4?w=400&h=600&fit=crop',
    duration: '35:40',
    category: 'Cultural',
  },
  {
    id: '9',
    title: 'Educational Innovation',
    image: 'https://images.unsplash.com/photo-1553531088-e914c4e3ee3d?w=400&h=600&fit=crop',
    duration: '42:55',
    category: 'Education',
  },
  {
    id: '10',
    title: 'Leadership in Crisis',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop',
    duration: '46:30',
    category: 'Lecture',
  },
  {
    id: '11',
    title: 'Health & Wellness',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop',
    duration: '28:15',
    category: 'Health',
  },
];

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-4 md:p-8 bg-white dark:bg-gray-950 min-h-screen transition-colors"
    >
      {/* Featured */}
      <FeaturedVideo items={featuredVideos} />

      {/* Recently Watched */}
      <ContentSection
        title="Continue Watching"
        description="Pick up where you left off"
        items={recentlyWatched}
      />

      {/* Recommended */}
      <ContentSection
        title="Recommended For You"
        description="Based on your viewing history"
        items={recommendations}
      />

      {/* Trending */}
      <ContentSection
        title="Trending Now"
        description="What's popular this week"
        items={recommendations.slice(0, 5)}
      />
    </motion.div>
  );
}
