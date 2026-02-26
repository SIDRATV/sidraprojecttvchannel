'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-brand-600 dark:bg-brand-600 text-white hover:bg-brand-700 dark:hover:bg-brand-700 shadow-lg shadow-brand-500/50',
    secondary: 'bg-brand-500/10 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/30 dark:border-brand-500/30 hover:bg-brand-500/20 dark:hover:bg-brand-500/20',
    ghost: 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const buttonClass = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={buttonClass}
          {...(props as any)}
        >
          {children}
        </motion.button>
      </Link>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={buttonClass}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
