'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: number;
  currency: string;
  billingPeriod: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  onSelect: () => void;
  delay?: number;
}

export default function PricingCard({
  name,
  price,
  currency,
  billingPeriod,
  description,
  features,
  buttonText,
  isPopular = false,
  onSelect,
  delay = 0,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
      className={`relative rounded-2xl overflow-hidden transition-all ${
        isPopular
          ? 'ring-2 ring-blue-500 lg:scale-105'
          : 'border border-gray-700 hover:border-blue-500/50'
      }`}
    >
      {/* Background */}
      <div
        className={`absolute inset-0 ${
          isPopular
            ? 'bg-gradient-to-br from-blue-900/30 to-gray-900'
            : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50'
        }`}
      />

      {/* Popular Badge */}
      {isPopular && (
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold rounded-full">
            Most Popular
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="relative p-8 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white">{price}</span>
            <span className="text-xl text-gray-400">{currency}</span>
          </div>
          <p className="text-gray-400 text-sm">Per {billingPeriod}</p>
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSelect}
          className={`w-full py-3 px-4 font-bold rounded-lg transition-all ${
            isPopular
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/50'
              : 'bg-gray-700/50 text-white hover:bg-gray-600/50 border border-gray-600'
          }`}
        >
          {buttonText}
        </motion.button>

        {/* Features */}
        <div className="space-y-3 pt-4 border-t border-gray-700">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + idx * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-blue-400" />
              </div>
              <span className="text-gray-300 text-sm">{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
