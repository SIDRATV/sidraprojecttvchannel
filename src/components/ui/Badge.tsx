'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-500/30',
    success: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30',
    warning: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30',
    error: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30',
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${variants[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.span>
  );
}
