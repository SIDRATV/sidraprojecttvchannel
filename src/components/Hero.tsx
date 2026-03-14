'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/Button';

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked
      });
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <section className="relative w-full h-96 md:h-[500px] overflow-hidden bg-white dark:bg-gray-950 transition-colors" suppressHydrationWarning>
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
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/50 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-gray-950 dark:via-transparent dark:to-transparent" />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 h-full flex items-center justify-start"
        suppressHydrationWarning
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-6 inline-block">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/30">
                <span className="w-2 h-2 bg-islamic-green rounded-full animate-pulse"></span>
                <span className="text-sm text-brand-300">Now Streaming Premium Content</span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="block text-gray-950 dark:text-white">Discover Islamic</span>
              <span className="block text-gradient">Innovation & Excellence</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed"
            >
              Experience premium Islamic media showcasing groundbreaking projects within the Sidra ecosystem. 
              From inspirational documentaries to innovative tutorials, explore stories that matter.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="primary" href="#trending">
                <Play size={20} />
                Start Watching
              </Button>
              <Button size="lg" variant="secondary">
                Explore Categories
              </Button>
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mt-12 pt-8 border-t border-gray-300 dark:border-gray-800"
            >
              {[
                { label: 'Videos', value: '1000+' },
                { label: 'Subscribers', value: '50K+' },
                { label: 'Watch Hours', value: '100K+' },
              ].map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-gray-950 dark:text-white">{stat.value}</div>
                  <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Scroll to explore</span>
          <svg
            className="w-6 h-6 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}
