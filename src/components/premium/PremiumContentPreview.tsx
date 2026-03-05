'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Play } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  image: string;
  category: string;
}

interface PremiumContentPreviewProps {
  content: ContentItem[];
}

export default function PremiumContentPreview({ content }: PremiumContentPreviewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="flex gap-6 overflow-x-auto pb-4 px-4 md:px-0 scrollbar-hide"
      >
        {content.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            onHoverStart={() => setHoveredId(item.id)}
            onHoverEnd={() => setHoveredId(null)}
            className="relative flex-shrink-0 w-80 h-48 rounded-xl overflow-hidden group cursor-pointer"
          >
            {/* Image */}
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />

            {/* Blur Overlay - Premium Lock */}
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: hoveredId === item.id ? 0.7 : 0.5 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center"
            >
              <div className="text-center space-y-3">
                <motion.div
                  animate={{ scale: hoveredId === item.id ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Lock className="w-12 h-12 text-yellow-400 mx-auto" />
                </motion.div>
                <div>
                  <p className="text-white font-bold text-sm">Premium Content</p>
                  <p className="text-white/80 text-xs">Unlock access</p>
                </div>
              </div>
            </motion.div>

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/50 to-transparent">
              <p className="text-xs text-blue-400 font-semibold mb-1">{item.category}</p>
              <h3 className="text-white font-bold text-sm line-clamp-2">{item.title}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Scroll Hint */}
      <motion.div
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 opacity-70"
      >
        →
      </motion.div>
    </div>
  );
}
