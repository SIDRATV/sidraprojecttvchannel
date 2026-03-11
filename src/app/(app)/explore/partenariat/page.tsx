'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Users, Star, TrendingUp, ArrowRight, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Partner {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  rating: number;
  reviews: number;
  followers: number;
  status: 'active' | 'pending' | 'featured';
  joinDate: string;
  benefits: string[];
}

const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'TechHub Innovation',
    description: 'Leading technology development agency focusing on AI and blockchain solutions',
    category: 'Technology',
    logo: '🚀',
    rating: 4.8,
    reviews: 342,
    followers: 15200,
    status: 'featured',
    joinDate: 'Jan 2024',
    benefits: ['Revenue Sharing', 'Co-marketing', 'Technical Support'],
  },
  {
    id: '2',
    name: 'Islamic Learning Academy',
    description: 'Premium Islamic education platform with certified instructors',
    category: 'Education',
    logo: '📚',
    rating: 4.9,
    reviews: 521,
    followers: 28500,
    status: 'featured',
    joinDate: 'Dec 2023',
    benefits: ['Credential Recognition', 'Student Access', 'API Integration'],
  },
  {
    id: '3',
    name: 'Green Energy Solutions',
    description: 'Sustainable technology and renewable energy implementation',
    category: 'Sustainability',
    logo: '💚',
    rating: 4.6,
    reviews: 218,
    followers: 9800,
    status: 'active',
    joinDate: 'Mar 2024',
    benefits: ['Eco-Certification', 'Grant Access', 'Network Expansion'],
  },
  {
    id: '4',
    name: 'Global Healthcare Network',
    description: 'International medical services and health information platform',
    category: 'Healthcare',
    logo: '⚕️',
    rating: 4.7,
    reviews: 456,
    followers: 32100,
    status: 'featured',
    joinDate: 'Feb 2024',
    benefits: ['Health Insurance', 'Research Data', 'Expert Network'],
  },
  {
    id: '5',
    name: 'Creative Studios Collective',
    description: 'Network of content creators and digital artists',
    category: 'Arts & Media',
    logo: '🎨',
    rating: 4.4,
    reviews: 287,
    followers: 11400,
    status: 'active',
    joinDate: 'Apr 2024',
    benefits: ['Portfolio Showcase', 'Collaboration Tools', 'Revenue Streams'],
  },
  {
    id: '6',
    name: 'Financial Innovation Labs',
    description: 'Fintech solutions for Islamic banking and finance',
    category: 'Finance',
    logo: '💰',
    rating: 4.9,
    reviews: 678,
    followers: 45300,
    status: 'featured',
    joinDate: 'Jan 2024',
    benefits: ['Payment Integration', 'Compliance Support', 'Business Tools'],
  },
];

export default function PartenariatPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  const categories = Array.from(new Set(mockPartners.map((p) => p.category)));
  const filteredPartners = selectedCategory
    ? mockPartners.filter((p) => p.category === selectedCategory)
    : mockPartners;

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
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
            <Award className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-gray-950 dark:text-white">Partners</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Join our network of innovative organizations</p>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        variants={itemVariants}
        className="mb-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-8 text-white"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Become a Partner</h2>
            <p className="text-pink-100">Collaborate with us to create meaningful impact and grow together</p>
          </div>
          <Button size="lg" variant="primary" className="bg-white text-pink-600 hover:bg-pink-50">
            Apply Now
            <ArrowRight size={18} />
          </Button>
        </div>
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
              ? 'bg-pink-600 text-white'
              : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          All Partners
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            {category}
          </button>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'Active Partners', value: mockPartners.filter(p => p.status === 'active' || p.status === 'featured').length },
          { label: 'Total Contributors', value: mockPartners.reduce((sum, p) => sum + p.followers, 0).toLocaleString() },
          { label: 'Success Rate', value: '98%' },
          { label: 'Countries', value: '45+' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-950 dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Partners Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredPartners.map((partner, idx) => (
          <motion.div
            key={partner.id}
            variants={itemVariants}
            whileHover={{ y: -8 }}
            onClick={() => setSelectedPartner(selectedPartner === partner.id ? null : partner.id)}
            className={`rounded-xl overflow-hidden border transition-all cursor-pointer backdrop-blur-sm ${
              selectedPartner === partner.id
                ? 'ring-2 ring-pink-500 bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-500/10 dark:to-rose-500/10 border-pink-300 dark:border-pink-700'
                : partner.status === 'featured'
                ? 'bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-500/5 dark:to-orange-500/5 border-yellow-200 dark:border-yellow-700'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-pink-300 dark:hover:border-pink-700'
            }`}
          >
            {/* Featured Badge */}
            {partner.status === 'featured' && (
              <div className="relative h-1 bg-gradient-to-r from-yellow-400 to-orange-400" />
            )}

            <div className="p-6">
              {/* Logo and Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl flex items-center justify-center text-4xl">
                  {partner.logo}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  partner.status === 'featured' ? 'bg-yellow-500 text-white' :
                  partner.status === 'active' ? 'bg-green-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {partner.status.toUpperCase()}
                </span>
              </div>

              {/* Name and Category */}
              <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-2">
                {partner.name}
              </h3>
              <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold mb-3">
                {partner.category}
              </p>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {partner.description}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(partner.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-950 dark:text-white">
                  {partner.rating}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  ({partner.reviews} reviews)
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200 dark:border-gray-800 mb-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                    <Users size={12} />
                    Followers
                  </p>
                  <p className="text-lg font-bold text-gray-950 dark:text-white">
                    {(partner.followers / 1000).toFixed(1)}K
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                    <TrendingUp size={12} />
                    Growth
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    +12%
                  </p>
                </div>
              </div>

              {/* Benefits */}
              {selectedPartner === partner.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 mb-4"
                >
                  <p className="text-sm font-semibold text-gray-950 dark:text-white">Partnership Benefits:</p>
                  {partner.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-pink-600" />
                      {benefit}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Action Button */}
              <Button
                size="sm"
                variant="primary"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Connect Now
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredPartners.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Award size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No partners in this category.</p>
        </motion.div>
      )}
    </div>
  );
}
