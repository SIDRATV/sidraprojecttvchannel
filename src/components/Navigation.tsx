'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from './ui/Button';

export function Navigation() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-12 h-12 flex-shrink-0"
            >
              <Image
                src="/sidra-logo.webp"
                alt="Sidra Logo"
                fill
                className="object-contain drop-shadow-md"
                priority
              />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg text-gray-950 dark:text-white">Sidra</h1>
              <p className="text-xs text-brand-500 dark:text-brand-400 font-medium">TV Channel</p>
            </div>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            {isDark ? (
              <Sun size={20} className="text-gold-400" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
          </motion.button>

          {/* Create Account Button */}
          <Link href="/login">
            <Button size="sm" variant="primary">
              Create Account
            </Button>
          </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
