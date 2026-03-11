'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Newspaper, Search, Calendar, User, Share2, Heart, MessageCircle, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  readTime: number;
  likes: number;
  comments: number;
  featured: boolean;
}

const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Revolutionary AI Technology Transforms Islamic Education',
    description: 'New artificial intelligence solutions are changing how Islamic studies are taught globally',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    category: 'Technology',
    author: 'Dr. Ahmed Hassan',
    date: 'Today',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
    readTime: 5,
    likes: 1245,
    comments: 98,
    featured: true,
  },
  {
    id: '2',
    title: 'Sustainable Development Initiative Reaches New Milestone',
    description: 'Global partnership announces major achievement in environmental restoration',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    category: 'Sustainability',
    author: 'Sarah Johnson',
    date: '2 hours ago',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&h=400&fit=crop',
    readTime: 7,
    likes: 892,
    comments: 54,
    featured: true,
  },
  {
    id: '3',
    title: 'Youth Empowerment Program Celebrates 10,000 Graduates',
    description: 'Landmark achievement as education initiative reaches international scale',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    category: 'Education',
    author: 'Fatima Al-Rashid',
    date: '5 hours ago',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    readTime: 4,
    likes: 2341,
    comments: 156,
    featured: false,
  },
  {
    id: '4',
    title: 'Islamic Finance Innovations Attract Global Investment',
    description: 'New digital platforms enable easier access to Shariah-compliant financial services',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    category: 'Finance',
    author: 'Mohammed Al-Madani',
    date: '1 day ago',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    readTime: 6,
    likes: 1567,
    comments: 123,
    featured: false,
  },
  {
    id: '5',
    title: 'Healthcare Network Launches Community Wellness Program',
    description: 'Comprehensive health initiative aims to improve wellbeing across developing regions',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    category: 'Healthcare',
    author: 'Dr. Layla Al-Fahad',
    date: '1 day ago',
    image: 'https://images.unsplash.com/photo-1576091160550-112173cba4b7?w=800&h=400&fit=crop',
    readTime: 8,
    likes: 934,
    comments: 67,
    featured: false,
  },
  {
    id: '6',
    title: 'Creative Arts Festival Celebrates Digital Innovation',
    description: 'International event showcases emerging trends in digital arts and media',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    category: 'Arts & Culture',
    author: 'Hassan Al-Rashid',
    date: '2 days ago',
    image: 'https://images.unsplash.com/photo-1577720643272-265e434ff3a4?w=800&h=400&fit=crop',
    readTime: 5,
    likes: 1102,
    comments: 89,
    featured: false,
  },
];

export default function ActualiterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(mockArticles.map((a) => a.category)));
  
  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = filteredArticles.filter((a) => a.featured);
  const regularArticles = filteredArticles.filter((a) => !a.featured);

  const toggleLike = (articleId: string) => {
    const newLiked = new Set(likedArticles);
    if (newLiked.has(articleId)) {
      newLiked.delete(articleId);
    } else {
      newLiked.add(articleId);
    }
    setLikedArticles(newLiked);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-8 transition-colors">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Newspaper className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-gray-950 dark:text-white">Actualités</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Latest news and updates from our community</p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row gap-4 mb-8"
      >
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Filter Button */}
        <Button size="lg" variant="secondary" className="flex items-center gap-2">
          <Filter size={18} />
          Filter
        </Button>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        variants={itemVariants}
        className="flex gap-2 mb-8 overflow-x-auto pb-2"
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
            selectedCategory === null
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          All News
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            {category}
          </button>
        ))}
      </motion.div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-orange-600" />
            Featured Articles
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredArticles.map((article, idx) => (
              <motion.div
                key={article.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-500/5 dark:to-red-500/5 hover:border-orange-300 dark:hover:border-orange-700 transition-all group cursor-pointer"
                onClick={() => setSelectedArticle(selectedArticle === article.id ? null : article.id)}
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${article.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
                  
                  {/* Featured Badge */}
                  <span className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    FEATURED
                  </span>

                  {/* Category */}
                  <span className="absolute bottom-4 left-4 px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full">
                    {article.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-3 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {article.description}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 py-4 border-y border-gray-200 dark:border-gray-800 mb-4">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      {article.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {article.date}
                    </div>
                    <div className="flex items-center gap-1">
                      📖 {article.readTime} min read
                    </div>
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(article.id);
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                          likedArticles.has(article.id)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                        }`}
                      >
                        <Heart size={16} fill={likedArticles.has(article.id) ? 'currentColor' : 'none'} />
                        {article.likes}
                      </button>
                      <div className="flex items-center gap-1 px-3 py-1 text-gray-600 dark:text-gray-400">
                        <MessageCircle size={16} />
                        {article.comments}
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-900 rounded-lg transition-colors">
                      <Share2 size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Regular Articles */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-2xl font-bold text-gray-950 dark:text-white mb-6">Latest Articles</h2>
        <div className="space-y-4">
          {regularArticles.map((article, idx) => (
            <motion.div
              key={article.id}
              variants={itemVariants}
              whileHover={{ x: 5 }}
              className="flex gap-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer"
              onClick={() => setSelectedArticle(selectedArticle === article.id ? null : article.id)}
            >
              {/* Small Image */}
              <div
                className="w-32 h-32 rounded-lg bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${article.image})` }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">{article.date}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-2 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {article.description}
                </p>

                {/* Meta and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {article.author}
                    </span>
                    <span>📖 {article.readTime} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(article.id);
                      }}
                      className={`flex items-center gap-1 text-sm ${
                        likedArticles.has(article.id)
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <Heart size={14} fill={likedArticles.has(article.id) ? 'currentColor' : 'none'} />
                      {article.likes}
                    </button>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <MessageCircle size={14} />
                      {article.comments}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Empty State */}
      {filteredArticles.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Newspaper size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No articles found matching your criteria.</p>
        </motion.div>
      )}
    </div>
  );
}
