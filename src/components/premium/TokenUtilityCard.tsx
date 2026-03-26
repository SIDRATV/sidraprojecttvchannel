'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TokenUtilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export default function TokenUtilityCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: TokenUtilityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-brand-500/20 rounded-xl hover:border-brand-500/50 transition-all"
    >
      <motion.div
        animate={{ rotate: [0, 10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-500 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-brand-500/50 transition-all"
      >
        <Icon className="text-white" size={32} />
      </motion.div>

      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>

      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.8 }}
        viewport={{ once: true }}
        style={{ originX: 0 }}
        className="h-1 bg-gradient-to-r from-brand-500 to-brand-400 rounded-full mt-4"
      />
    </motion.div>
  );
}
