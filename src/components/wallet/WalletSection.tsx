'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface WalletSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function WalletSection({
  title,
  description,
  icon: Icon,
  children,
  variant = 'primary',
}: WalletSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Section Header */}
      <div className="mb-8 flex items-center gap-3">
        {Icon && (
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30"
          >
            <Icon className="w-6 h-6 text-blue-400" />
          </motion.div>
        )}
        <div>
          <h2 className="text-3xl font-bold text-white">{title}</h2>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </motion.div>
  );
}
