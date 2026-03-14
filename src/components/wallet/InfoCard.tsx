'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, Lightbulb, LucideIcon } from 'lucide-react';

type InfoCardType = 'info' | 'tip' | 'warning' | 'success';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  type?: InfoCardType;
}

const iconMap: Record<InfoCardType, LucideIcon> = {
  info: Info,
  tip: Lightbulb,
  warning: AlertCircle,
  success: CheckCircle2,
};

const styleConfig = {
  info: {
    bg: 'from-blue-900/40 to-blue-800/30',
    border: 'border-blue-600/40',
    badge: 'bg-blue-600/30 text-blue-300',
    icon: 'text-blue-400',
  },
  tip: {
    bg: 'from-amber-900/40 to-amber-800/30',
    border: 'border-amber-600/40',
    badge: 'bg-amber-600/30 text-amber-300',
    icon: 'text-amber-400',
  },
  warning: {
    bg: 'from-orange-900/40 to-orange-800/30',
    border: 'border-orange-600/40',
    badge: 'bg-orange-600/30 text-orange-300',
    icon: 'text-orange-400',
  },
  success: {
    bg: 'from-emerald-900/40 to-emerald-800/30',
    border: 'border-emerald-600/40',
    badge: 'bg-emerald-600/30 text-emerald-300',
    icon: 'text-emerald-400',
  },
};

export function InfoCard({
  title,
  children,
  type = 'info',
}: InfoCardProps) {
  const Icon = iconMap[type];
  const config = styleConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative bg-gradient-to-br ${config.bg} backdrop-blur-xl border ${config.border} rounded-2xl p-6 overflow-hidden shadow-lg`}
    >
      {/* Animated border */}
      <div className={`absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} blur-lg`} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <motion.div
            whileHover={{ scale: 1.2, rotate: 10 }}
            className={`p-3 rounded-xl ${config.badge} flex-shrink-0 mt-1`}
          >
            <Icon className={`w-5 h-5 ${config.icon}`} />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <div className="text-sm text-slate-300 space-y-2">{children}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
