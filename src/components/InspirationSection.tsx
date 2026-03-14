'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const quotes = [
  {
    text: 'The best investment is in knowledge and innovation that serves humanity.',
    author: 'Islamic Wisdom',
    icon: '📚',
  },
  {
    text: 'Technology that respects our values creates a better tomorrow for all.',
    author: 'Sidra Vision',
    icon: '🚀',
  },
  {
    text: 'In the pursuit of excellence, integrity is the foundation of success.',
    author: 'Islamic Principle',
    icon: '💎',
  },
];

export function InspirationSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="relative py-20 overflow-hidden bg-white dark:bg-gray-950 transition-colors">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 left-10 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-islamic-teal/10 dark:bg-islamic-teal/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-950 dark:text-white">
            <span className="block mb-2">Daily Islamic Inspiration</span>
            <span className="text-gradient">For the Modern Digital Age</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Discover timeless wisdom that resonates with innovation and progress
          </p>
        </motion.div>

        {/* Quotes Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {quotes.map((quote, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="relative group"
            >
              {/* Card */}
              <div className="glass-effect p-5 sm:p-8 rounded-2xl h-full flex flex-col justify-between bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                {/* Quote Icon */}
                <div className="mb-4 sm:mb-6">
                  <Quote className="w-8 sm:w-10 h-8 sm:h-10 text-brand-500/50" />
                </div>

                {/* Quote Text */}
                <p className="text-lg sm:text-xl text-gray-950 dark:text-white mb-4 sm:mb-6 leading-relaxed flex-1">
                  <span>{`"${quote.text}"`}</span>
                </p>

                {/* Author */}
                <div className="pt-4 sm:pt-6 border-t border-gray-300 dark:border-gray-700">
                  <p className="text-xs sm:text-sm text-brand-700 dark:text-brand-300 font-semibold">{quote.author}</p>
                  <p className="text-2xl sm:text-3xl mt-2 sm:mt-3">{quote.icon}</p>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-brand-500/10 to-islamic-teal/10" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
