'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Total duration: fade in (1s) + hold (2s) + fade out (1s) = 4s
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black flex items-center justify-center z-50 flex-col"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, delay: 3 }}
    >
      {/* Logo with fade in and zoom */}
      <motion.div
        className="relative flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {/* Logo with glow effect */}
        <motion.div
          className="relative"
          animate={{
            filter: [
              'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))',
              'drop-shadow(0 0 40px rgba(34, 197, 94, 0.8))',
              'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* SVG Logo placeholder - using text as fallback */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            className="text-white"
          >
            <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="2" />
            <text
              x="60"
              y="70"
              textAnchor="middle"
              fill="currentColor"
              fontSize="32"
              fontWeight="bold"
              fontFamily="Arial"
            >
              S
            </text>
          </svg>
        </motion.div>

        {/* Title text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            SIDRA PROJECTS TV CHANNEL
          </h1>

          {/* Slogan with gradient and glow */}
          <motion.p
            className="text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-500 to-green-400 font-semibold"
            animate={{
              textShadow: [
                '0 0 10px rgba(34, 197, 94, 0.5), 0 0 10px rgba(217, 119, 6, 0.3)',
                '0 0 20px rgba(34, 197, 94, 0.8), 0 0 15px rgba(217, 119, 6, 0.6)',
                '0 0 10px rgba(34, 197, 94, 0.5), 0 0 10px rgba(217, 119, 6, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            L'information à la source
          </motion.p>
        </motion.div>

        {/* Decorative animated line */}
        <motion.div
          className="absolute -bottom-12 w-32 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{ originX: 0.5 }}
        />
      </motion.div>

      {/* Fade out the entire splash after 3 seconds */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 1, times: [0, 0.75, 1], delay: 3 }}
      />
    </motion.div>
  );
}
