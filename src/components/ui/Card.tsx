'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children: React.ReactNode;
  hover?: boolean;
}

export function Card({ children, hover = true, className }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      className={cn(
        'bg-white dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 backdrop-blur-sm',
        'hover:border-brand-400/30 dark:hover:border-brand-400/30 hover:shadow-premium transition-all duration-300',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
