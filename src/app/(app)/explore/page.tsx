'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ContentSection } from '@/components/app/ContentSection';
import { Grid, List } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  itemCount: number;
}

// Mock categories
const categories: Category[] = [
  {
    id: '1',
    name: 'Documentary',
    description: 'In-depth explorations and real-world stories',
    image: 'https://images.unsplash.com/photo-1642883516165-ab7aa9a4908d?w=600&h=400&fit=crop',
    itemCount: 24,
  },
  {
    id: '2',
    name: 'Education',
    description: 'Learning resources and courses',
    image: 'https://images.unsplash.com/photo-1553531088-e914c4e3ee3d?w=600&h=400&fit=crop',
    itemCount: 18,
  },
  {
    id: '3',
    name: 'Technology',
    description: 'Latest tech trends and innovations',
    image: 'https://images.unsplash.com/photo-1478685285201-75fa6294cbdc?w=600&h=400&fit=crop',
    itemCount: 32,
  },
  {
    id: '4',
    name: 'Islamic Studies',
    description: 'Religious and cultural content',
    image: 'https://images.unsplash.com/photo-1456819662031-fbb9411d529b?w=600&h=400&fit=crop',
    itemCount: 28,
  },
  {
    id: '5',
    name: 'Business',
    description: 'Entrepreneurship and finance',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    itemCount: 15,
  },
  {
    id: '6',
    name: 'Arts & Culture',
    description: 'Creative expression and heritage',
    image: 'https://images.unsplash.com/photo-1577720643272-265e434ff3a4?w=600&h=400&fit=crop',
    itemCount: 22,
  },
];

const allVideos: {
  id: string;
  title: string;
  image: string;
  duration: string;
  category: string;
}[] = [
  {
    id: '1',
    title: 'The Future of Islamic Finance',
    image: 'https://images.unsplash.com/photo-1542744173-8e90f7e3912d?w=400&h=600&fit=crop',
    duration: '45:30',
    category: 'Business',
  },
  {
    id: '2',
    title: 'Digital Transformation',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop',
    duration: '41:20',
    category: 'Technology',
  },
  {
    id: '3',
    title: 'Introduction to Blockchain',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=600&fit=crop',
    duration: '38:45',
    category: 'Technology',
  },
  {
    id: '4',
    title: 'Teaching in the Digital Age',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=600&fit=crop',
    duration: '52:10',
    category: 'Education',
  },
  {
    id: '5',
    title: 'Sustainable Development',
    image: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=600&fit=crop',
    duration: '38:12',
    category: 'Documentary',
  },
];

export default function ExplorePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredVideos = selectedCategory
    ? allVideos.filter((v) => v.category === selectedCategory)
    : allVideos;

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-gray-950 dark:text-white mb-2">Explore</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover new content across all categories
        </p>
      </motion.div>

      {/* Categories Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold">Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category.name ? null : category.name
                )
              }
              className={`relative h-40 rounded-xl overflow-hidden group transition-all ${
                selectedCategory === category.name ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Background */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${category.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <h3 className="font-bold text-lg">{category.name}</h3>
                <p className="text-xs text-gray-300">
                  {category.itemCount} videos
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Content Section */}
      {filteredVideos.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-950 dark:text-white">
              {selectedCategory ? `${selectedCategory} Videos` : 'All Videos'}
            </h2>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-800/50 p-1 rounded-lg transition-colors">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          <ContentSection
            title=""
            items={[...filteredVideos]}
            type="vertical"
          />
        </motion.section>
      )}
    </div>
  );
}
