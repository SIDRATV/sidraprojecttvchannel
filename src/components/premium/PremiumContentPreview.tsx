'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const isPremium = !!user?.premium_plan;

  return (
    <div className="relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="flex gap-6 overflow-x-auto pb-4 px-4 md:px-0 scrollbar-hide"
      >
        {content.map((item, idx) => {
          const card = (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.02 }}
              onHoverStart={() => setHoveredId(item.id)}
              onHoverEnd={() => setHoveredId(null)}
              className="relative flex-shrink-0 w-80 h-52 rounded-2xl overflow-hidden group cursor-pointer border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-gold-500/10"
            >
              {/* Image */}
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />

              {/* Overlay */}
              {isPremium ? (
                /* Premium user: play overlay on hover */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredId === item.id ? 1 : 0 }}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ scale: hoveredId === item.id ? 1.1 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 bg-gold-500/90 backdrop-blur-sm rounded-full shadow-lg shadow-gold-500/30"
                  >
                    <Play className="w-8 h-8 text-white" fill="white" />
                  </motion.div>
                </motion.div>
              ) : (
                /* Non-premium: lock overlay */
                <motion.div
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: hoveredId === item.id ? 0.7 : 0.5 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center"
                >
                  <div className="text-center space-y-3">
                    <motion.div
                      animate={{ 
                        scale: hoveredId === item.id ? 1.15 : 1,
                        rotate: hoveredId === item.id ? [0, -5, 5, 0] : 0
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="relative inline-block">
                        <Lock className="w-10 h-10 text-gold-400 mx-auto drop-shadow-lg" />
                        <Sparkles size={14} className="absolute -top-1 -right-1 text-gold-300 animate-pulse" />
                      </div>
                    </motion.div>
                    <div>
                      <p className="text-white font-bold text-sm">Premium Content</p>
                      <p className="text-gold-300/80 text-xs">Unlock to watch</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent">
                <p className="text-xs text-gold-400 font-semibold mb-1">{item.category}</p>
                <h3 className="text-white font-bold text-sm line-clamp-2">{item.title}</h3>
              </div>
            </motion.div>
          );

          return isPremium ? (
            <Link key={item.id} href={`/premium-videos/${item.id}`}>
              {card}
            </Link>
          ) : (
            <Link key={item.id} href="/premium">
              {card}
            </Link>
          );
        })}
      </motion.div>

      {/* Scroll Hint */}
      <motion.div
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-400/70"
      >
        →
      </motion.div>
    </div>
  );
}
