'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { User, Mail, Calendar, Trophy, Clock, Edit2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ContentSection } from '@/components/app/ContentSection';

const watchHistory = [
  {
    id: '1',
    title: 'The Legacy of Innovation',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=600&fit=crop',
    duration: '58:32',
    category: 'Documentary',
  },
  {
    id: '2',
    title: 'Understanding Blockchain',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop',
    duration: '48:23',
    category: 'Tutorial',
  },
  {
    id: '3',
    title: 'Future of Islamic Finance',
    image: 'https://images.unsplash.com/photo-1542744173-8e90f7e3912d?w=400&h=600&fit=crop',
    duration: '45:30',
    category: 'Finance',
  },
  {
    id: '4',
    title: 'Community Impact Stories',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop',
    duration: '52:15',
    category: 'Documentary',
  },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const stats = [
    { label: 'Videos Watched', value: '127' },
    { label: 'Total Watch Time', value: '342 hrs' },
    { label: 'Favorites', value: '34' },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Background */}
        <div className="h-40 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl mb-8" />

        {/* Profile Card */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-20 relative z-10">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
          >
            <User size={64} className="text-white" />
          </motion.div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {user?.full_name || 'User'}
            </h1>
            <p className="text-gray-400">{user?.email}</p>
            <p className="text-gray-500 text-sm mt-2">Member since January 2024</p>

            {/* Edit Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(!isEditing)}
              className="mt-4 flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Edit2 size={16} />
              <span>Edit Profile</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Videos Watched', value: '127', icon: '▶️' },
          { label: 'Total Watch Time', value: '342 hrs', icon: '⏱️' },
          { label: 'Favorites', value: '34', icon: '⭐' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Info Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Account Info */}
        <div className="p-6 bg-gray-800/30 rounded-lg border border-gray-700">
          <h3 className="font-bold text-lg mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Joined</p>
                <p className="font-semibold">January 15, 2024</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="p-6 bg-gray-800/30 rounded-lg border border-gray-700">
          <h3 className="font-bold text-lg mb-4">Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded accent-purple-500"
              />
              <span>Recommendations emails</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded accent-purple-500"
              />
              <span>New content notifications</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-purple-500"
              />
              <span>Weekly digest emails</span>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Watch History */}
      {watchHistory.length > 0 && (
        <ContentSection
          title="Your Watch History"
          description="Videos you've recently watched"
          items={watchHistory.slice(0, 5)}
        />
      )}
    </div>
  );
}
