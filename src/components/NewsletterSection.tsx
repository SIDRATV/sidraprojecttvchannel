'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, Film, Star, Bell, Send } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '@/lib/supabase';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await (supabase.from('newsletter').insert([{ email }] as any) as any);

      if (error) throw error;

      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden bg-white dark:bg-gray-950 transition-colors">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-gold-500/5 dark:from-brand-500/10 dark:via-transparent dark:to-gold-500/8" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/5 dark:bg-brand-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
            <Mail size={14} className="text-brand-500" />
            <span className="text-sm font-medium text-brand-600 dark:text-brand-400">Newsletter</span>
          </div>

          {/* Header */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-950 dark:text-white mb-4">
            Stay Updated with{' '}
            <span className="bg-gradient-to-r from-brand-500 via-brand-400 to-gold-500 bg-clip-text text-transparent">Premium Content</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-8 sm:mb-10 max-w-xl mx-auto">
            Get exclusive access to the latest documentaries, tutorials, and inspirational content from the Sidra ecosystem
          </p>

          {/* Newsletter Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <div className="flex-1 relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <Button
              type="submit"
              size="md"
              variant="primary"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Send size={16} />
              {loading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </motion.form>

          {/* Success Message */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 inline-flex items-center gap-2 text-brand-500 dark:text-brand-400"
            >
              <CheckCircle size={18} />
              <span className="font-medium text-sm">Thank you for subscribing!</span>
            </motion.div>
          )}

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-3 gap-4 sm:gap-8 mt-10 sm:mt-14"
          >
            {[
              { icon: Film, label: 'Weekly Updates', color: 'text-brand-500', bg: 'bg-brand-500/10', border: 'border-brand-500/20' },
              { icon: Star, label: 'Exclusive Access', color: 'text-gold-500', bg: 'bg-gold-500/10', border: 'border-gold-500/20' },
              { icon: Bell, label: 'Premium Alerts', color: 'text-brand-400', bg: 'bg-brand-400/10', border: 'border-brand-400/20' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center gap-3"
              >
                <div className={`p-3 rounded-xl ${feature.bg} border ${feature.border}`}>
                  <feature.icon size={22} className={feature.color} />
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-semibold text-xs sm:text-sm">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
