'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { categoryService } from '@/services/categories';
import * as Icons from 'lucide-react';
import type { Category } from '@/types';

export function CategoryBrowser() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error instanceof Error ? error.message : error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  // Icon mapping
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    Film: Icons.Film,
    Lightbulb: Icons.Lightbulb,
    AlertCircle: Icons.AlertCircle,
    Mic2: Icons.Mic2,
    Heart: Icons.Heart,
    Zap: Icons.Zap,
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50 dark:bg-gray-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="py-16 bg-gray-50 dark:bg-gray-900/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-950 dark:text-white mb-3">Browse Categories</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Explore our diverse collection of Islamic content and innovations
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-brand-500 to-islamic-teal rounded-full mt-4" />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Icons.Layers;

            return (
              <Link key={category.id} href={`/?category=${category.id}`}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  className="relative group cursor-pointer"
                >
                  {/* Card */}
                  <div
                    className="p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300"
                    style={{
                      backgroundColor: `${category.color}15`,
                      borderColor: `${category.color}40`,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${category.color}30` }}
                    >
                      <IconComponent size={24} style={{ color: category.color }} />
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-gray-950 dark:text-white mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {category.description || 'Explore content'}
                    </p>
                  </div>

                  {/* Hover Effect */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-all duration-300"
                    style={{ backgroundColor: category.color }}
                  />
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
