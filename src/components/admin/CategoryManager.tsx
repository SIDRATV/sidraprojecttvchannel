'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { categoryService } from '@/services/categories';
import { Loader2 } from 'lucide-react';
import type { Category } from '@/types';

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '',
    color: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Categories List */}
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ y: -2 }}
                className="p-4 bg-gray-900/50 rounded-lg border border-gray-800"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${category.color}30` }}
                >
                  <span>📁</span>
                </div>
                <h3 className="font-semibold text-white mb-1">{category.name}</h3>
                <p className="text-sm text-gray-400">{category.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
