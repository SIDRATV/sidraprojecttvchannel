'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { YouTubeFeaturedCarousel } from '@/components/app/YouTubeFeaturedCarousel';
import { YouTubeSection } from '@/components/app/YouTubeSection';
import { PremiumBanner, PremiumContentPreview } from '@/components/premium';
import { Heart, MessageCircle, Share2, Star } from 'lucide-react';

export default function DashboardPage() {
  // Mock articles data from actualiter
  const articles = [
    {
      id: '1',
      title: 'Revolutionary AI Technology Transforms Islamic Education',
      description: 'New artificial intelligence solutions are changing how Islamic studies are taught globally',
      category: 'Technology',
      author: 'Dr. Ahmed Hassan',
      date: 'Today',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop',
      readTime: 5,
      likes: 1245,
      comments: 98,
    },
    {
      id: '2',
      title: 'Sustainable Development Initiative Reaches New Milestone',
      description: 'Global partnership announces major achievement in environmental restoration',
      category: 'Sustainability',
      author: 'Sarah Johnson',
      date: '2 hours ago',
      image: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=400&fit=crop',
      readTime: 7,
      likes: 892,
      comments: 54,
    },
    {
      id: '3',
      title: 'Youth Empowerment Program Celebrates 10,000 Graduates',
      description: 'Landmark achievement as education initiative reaches international scale',
      category: 'Education',
      author: 'Fatima Al-Rashid',
      date: '5 hours ago',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
      readTime: 4,
      likes: 2341,
      comments: 156,
    },
    {
      id: '4',
      title: 'Islamic Finance Innovations Attract Global Investment',
      description: 'New digital platforms enable easier access to Shariah-compliant financial services',
      category: 'Finance',
      author: 'Mohammed Al-Madani',
      date: '1 day ago',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
      readTime: 6,
      likes: 1567,
      comments: 123,
    },
    {
      id: '5',
      title: 'Healthcare Network Launches Community Wellness Program',
      description: 'Comprehensive health initiative aims to improve wellbeing across developing regions',
      category: 'Healthcare',
      author: 'Dr. Layla Al-Fahad',
      date: '1 day ago',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
      readTime: 8,
      likes: 934,
      comments: 67,
    },
    {
      id: '6',
      title: 'Creative Arts Festival Celebrates Digital Innovation',
      description: 'International event showcases emerging trends in digital arts and media',
      category: 'Arts & Culture',
      author: 'Hassan Al-Rashid',
      date: '2 days ago',
      image: 'https://images.unsplash.com/photo-1516035069371-29a083244fa5?w=800&h=400&fit=crop',
      readTime: 5,
      likes: 1102,
      comments: 89,
    },
  ];

  // Premium content data
  const premiumContent = [
    {
      id: '1',
      title: 'The Future of AI: How Startups are Changing the World',
      image: 'https://images.unsplash.com/photo-1618761490192-04901461159e?w=500&h=300&fit=crop',
      category: 'Documentary',
    },
    {
      id: '2',
      title: 'Founder Stories: From Idea to $1B Valuation',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
      category: 'Interview',
    },
    {
      id: '3',
      title: 'Blockchain Revolution: Building Web3 Applications',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&h=300&fit=crop',
      category: 'Masterclass',
    },
    {
      id: '4',
      title: 'Inside OpenAI: Secrets to Building Revolutionary Products',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
      category: 'Documentary',
    },
    {
      id: '5',
      title: 'VC Insights: How to Raise Your First Million',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',
      category: 'Masterclass',
    },
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

      {/* Latest Articles Section - Horizontal Scrollable */}
      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-950 dark:text-white mb-2">Latest News</h2>
          <p className="text-gray-600 dark:text-gray-400">Stay updated with the latest articles from our community</p>
        </div>
        <Link href="/explore/actualiter" className="text-orange-600 hover:text-orange-700 font-semibold text-sm">
          View all articles →
        </Link>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-4">
            {articles.map((article) => (
              <Link key={article.id} href="/explore/actualiter">
                <motion.div
                  whileHover={{ y: -4 }}
                  className="flex-shrink-0 w-80 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${article.image})` }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-500">{article.date}</span>
                    </div>
                    <h3 className="font-bold text-gray-950 dark:text-white mb-2 line-clamp-2 text-sm">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Heart size={14} />
                          {article.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          {article.comments}
                        </span>
                      </div>
                      <span>📖 {article.readTime}m</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Content Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-950 dark:text-white mb-2">Exclusive Content</h2>
          <p className="text-gray-600 dark:text-gray-400">Scroll to discover premium documentaries and masterclasses</p>
        </div>
        <PremiumContentPreview content={premiumContent} />
      </section>

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
