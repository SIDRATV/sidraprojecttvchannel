'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Cog, RefreshCw } from 'lucide-react';

export default function MaintenancePage() {
  const [message, setMessage] = useState(
    'Nous sommes en maintenance, nous reviendrons bientôt. Merci pour votre patience.'
  );

  useEffect(() => {
    fetch('/api/maintenance')
      .then((res) => res.json())
      .then((data) => {
        if (data.message) setMessage(data.message);
        // If maintenance is off, redirect to home
        if (!data.enabled) {
          window.location.href = '/';
        }
      })
      .catch(() => {});

    // Poll every 30 seconds to check if maintenance ended
    const interval = setInterval(() => {
      fetch('/api/maintenance')
        .then((res) => res.json())
        .then((data) => {
          if (!data.enabled) {
            window.location.href = '/';
          }
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-brand-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-center px-6 max-w-2xl"
      >
        {/* Animated icon cluster */}
        <div className="relative w-40 h-40 mx-auto mb-10">
          {/* Outer spinning ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-brand-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />

          {/* Middle pulsing ring */}
          <motion.div
            className="absolute inset-4 rounded-full border border-brand-500/30"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Center icon container */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            <div className="relative">
              {/* Main wrench icon */}
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Wrench className="w-16 h-16 text-brand-400" strokeWidth={1.5} />
              </motion.div>

              {/* Orbiting cog 1 */}
              <motion.div
                className="absolute -top-6 -right-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <Cog className="w-8 h-8 text-gold-400/70" strokeWidth={1.5} />
              </motion.div>

              {/* Orbiting cog 2 */}
              <motion.div
                className="absolute -bottom-4 -left-6"
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Cog className="w-6 h-6 text-brand-300/50" strokeWidth={1.5} />
              </motion.div>
            </div>
          </motion.div>

          {/* Pulsing glow */}
          <motion.div
            className="absolute inset-8 bg-brand-500/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-white via-brand-100 to-white bg-clip-text text-transparent">
            Maintenance en cours
          </span>
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-lg md:text-xl text-slate-300 leading-relaxed mb-10"
        >
          {message}
        </motion.p>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-3 text-slate-400"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
          <span className="text-sm">Vérification automatique toutes les 30 secondes</span>
        </motion.div>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-brand-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Sidra logo / branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 flex items-center justify-center gap-3"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-slate-500 text-sm font-medium">Sidra TV</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
