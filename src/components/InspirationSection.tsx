'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote, BookOpen, Rocket, Gem } from 'lucide-react';

const quotes = [
  {
    text: 'The best investment is in knowledge and innovation that serves humanity.',
    author: 'Islamic Wisdom',
    icon: BookOpen,
    gradient: 'from-brand-500 to-brand-400',
    glow: 'shadow-brand-500/20',
  },
  {
    text: 'Technology that respects our values creates a better tomorrow for all.',
    author: 'Sidra Vision',
    icon: Rocket,
    gradient: 'from-gold-500 to-gold-400',
    glow: 'shadow-gold-500/20',
  },
  {
    text: 'In the pursuit of excellence, integrity is the foundation of success.',
    author: 'Islamic Principle',
    icon: Gem,
    gradient: 'from-brand-400 to-gold-500',
    glow: 'shadow-brand-400/20',
  },
];

export function InspirationSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-white dark:bg-gray-950 transition-colors">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-brand-500/8 dark:bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-gold-500/6 dark:bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-center mb-14 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6">
            <Quote size={14} className="text-gold-500" />
            <span className="text-sm font-medium text-gold-600 dark:text-gold-400">Wisdom & Inspiration</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-950 dark:text-white">
            <span className="block mb-2">Daily Islamic Inspiration</span>
            <span className="bg-gradient-to-r from-brand-500 via-brand-400 to-gold-500 bg-clip-text text-transparent">For the Modern Digital Age</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Discover timeless wisdom that resonates with innovation and progress
          </p>
        </motion.div>

        {/* Quotes Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {quotes.map((quote, index) => {
            const Icon = quote.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                {/* Card */}
                <div className="p-6 sm:p-8 rounded-2xl h-full flex flex-col justify-between bg-gray-50 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-800/80 hover:border-brand-500/30 dark:hover:border-brand-500/20 transition-all duration-300 hover:shadow-xl">
                  {/* Quote Icon */}
                  <div className="mb-5 sm:mb-6">
                    <Quote className="w-8 sm:w-10 h-8 sm:h-10 text-brand-500/30" />
                  </div>

                  {/* Quote Text */}
                  <p className="text-lg sm:text-xl text-gray-800 dark:text-gray-100 mb-6 sm:mb-8 leading-relaxed flex-1">
                    &ldquo;{quote.text}&rdquo;
                  </p>

                  {/* Author & Icon */}
                  <div className="pt-5 sm:pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <p className="text-sm text-brand-600 dark:text-brand-300 font-semibold">{quote.author}</p>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${quote.gradient} shadow-lg ${quote.glow}`}>
                      <Icon size={18} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-brand-500/5 to-gold-500/5 pointer-events-none" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
