'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Sparkles, ArrowDown, Film, Users, Clock } from 'lucide-react';
import { Button } from './ui/Button';

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative w-full min-h-[85vh] md:min-h-[90vh] overflow-hidden bg-white dark:bg-gray-950 transition-colors" suppressHydrationWarning>
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          suppressHydrationWarning
        >
          <source
            src="https://videos.pexels.com/video-files/3209828/3209828-sd_640_360_30fps.mp4"
            type="video/mp4"
          />
        </video>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/40 dark:from-gray-950 dark:via-gray-950/80 dark:to-gray-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/30 dark:from-gray-950 dark:via-transparent dark:to-gray-950/30" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-1/4 h-64 w-64 rounded-full bg-brand-500/10 dark:bg-brand-500/15 blur-3xl animate-pulse" />
        <div className="absolute bottom-32 left-1/3 h-48 w-48 rounded-full bg-gold-500/10 dark:bg-gold-500/15 blur-3xl" />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 h-full flex items-center justify-start min-h-[85vh] md:min-h-[90vh]"
        suppressHydrationWarning
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-8 inline-block">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-brand-500/10 dark:bg-brand-400/10 border border-brand-500/25 dark:border-brand-400/25 backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-400" />
                </span>
                <span className="text-sm text-brand-600 dark:text-brand-300 font-medium">Now Streaming Premium Content</span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1]">
              <span className="block text-gray-950 dark:text-white">Discover Islamic</span>
              <span className="block bg-gradient-to-r from-brand-500 via-brand-400 to-gold-500 bg-clip-text text-transparent">Innovation & Excellence</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-xl"
            >
              Experience premium Islamic media showcasing groundbreaking projects within the Sidra ecosystem. 
              From inspirational documentaries to innovative tutorials.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="primary" href="#trending">
                <Play size={20} fill="currentColor" />
                Start Watching
              </Button>
              <Button size="lg" variant="secondary" href="#categories">
                Explore Categories
              </Button>
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-6 md:gap-10 mt-14 pt-8 border-t border-gray-200/60 dark:border-gray-800/60"
            >
              {[
                { icon: Film, label: 'Videos', value: '1000+' },
                { icon: Users, label: 'Subscribers', value: '50K+' },
                { icon: Clock, label: 'Watch Hours', value: '100K+' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gold-500/10 dark:bg-gold-500/15 border border-gold-500/20 hidden sm:flex">
                    <stat.icon size={18} className="text-gold-500" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-gray-950 dark:text-white">{stat.value}</div>
                    <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wider uppercase">Scroll</span>
          <div className="p-1.5 rounded-full border border-gray-300 dark:border-gray-700">
            <ArrowDown size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
