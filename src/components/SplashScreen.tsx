'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import './splash-screen.css';

interface SplashSettings {
  enabled: boolean;
  duration: number;
  title: string;
  slogan: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImage: string;
  textColor: string;
  showParticles: boolean;
  showFooter: boolean;
  footerText: string;
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [settings, setSettings] = useState<SplashSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/splash-screen');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch splash settings:', error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, settings.duration * 1000);

    return () => clearTimeout(timer);
  }, [settings, onComplete]);

  if (!isVisible || !settings || !settings.enabled) return null;

  const getBackground = () => {
    if (settings.backgroundType === 'solid') return settings.backgroundColor;
    if (settings.backgroundType === 'gradient') return settings.backgroundGradient;
    if (settings.backgroundType === 'image' && settings.backgroundImage) {
      return `url(${settings.backgroundImage}) center/cover no-repeat`;
    }
    return settings.backgroundGradient || '#000000';
  };

  return (
    <motion.div
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center z-[9999]"
      style={{
        background: getBackground(),
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, delay: settings.duration - 1 }}
    >
      {/* Animated particles background */}
      {settings.showParticles && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="particles-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  '--duration': `${8 + Math.random() * 8}s`,
                  '--delay': `${Math.random() * 2}s`,
                  '--left': `${Math.random() * 100}%`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      )}

      {/* Light sweep effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 3, ease: 'easeInOut' }}
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(34, 197, 94, 0.2) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
        }}
      />

      {/* Center content */}
      <motion.div
        className="relative flex flex-col items-center gap-8 z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {/* Logo with glow */}
        <motion.div
          className="relative w-32 h-32 flex items-center justify-center"
          animate={{
            filter: [
              'drop-shadow(0 0 20px rgba(34, 197, 94, 0.4)) drop-shadow(0 0 40px rgba(217, 119, 6, 0.2))',
              'drop-shadow(0 0 40px rgba(34, 197, 94, 0.7)) drop-shadow(0 0 60px rgba(217, 119, 6, 0.4))',
              'drop-shadow(0 0 20px rgba(34, 197, 94, 0.4)) drop-shadow(0 0 40px rgba(217, 119, 6, 0.2))',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/sidra-logo.webp"
            alt="Sidra Projects TV Channel"
            width={128}
            height={128}
            priority
            className="w-full h-full object-contain"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <h1
            className="text-4xl md:text-5xl font-bold tracking-wider mb-4"
            style={{ color: settings.textColor }}
          >
            {settings.title}
          </h1>

          {/* Slogan */}
          <motion.p
            className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-emerald-400 via-yellow-500 to-emerald-400 bg-clip-text text-transparent"
            animate={{
              textShadow: [
                '0 0 10px rgba(34, 197, 94, 0.4), 0 0 20px rgba(217, 119, 6, 0.2)',
                '0 0 20px rgba(34, 197, 94, 0.7), 0 0 30px rgba(217, 119, 6, 0.5)',
                '0 0 10px rgba(34, 197, 94, 0.4), 0 0 20px rgba(217, 119, 6, 0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {settings.slogan}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Bottom section */}
      {settings.showFooter && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-4 pb-12 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {/* Loading dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          {/* Footer text */}
          <motion.p
            className="text-sm font-light tracking-wider"
            style={{ color: `${settings.textColor}80` }}
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {settings.footerText}
          </motion.p>
        </motion.div>
      )}

      {/* Fade out overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 1, times: [0, 0.75, 1], delay: settings.duration - 1 }}
        style={{
          background: getBackground(),
        }}
      />
    </motion.div>
  );
}
