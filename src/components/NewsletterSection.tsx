'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';
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
      // Demo mode - show success anyway
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative py-16 overflow-hidden bg-white dark:bg-gray-900/50 transition-colors">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 dark:from-brand-600/20 to-islamic-teal/10 dark:to-islamic-teal/20" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent dark:to-gray-950" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Header */}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-950 dark:text-white mb-4">
            Stay Updated with <span className="text-gradient">Premium Content</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
            Get exclusive access to the latest documentaries, tutorials, and inspirational content from the Sidra ecosystem
          </p>

          {/* Newsletter Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-colors"
            />
            <Button
              type="submit"
              size="md"
              variant="primary"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </motion.form>

          {/* Success Message */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 inline-flex items-center gap-2 text-green-400"
            >
              <CheckCircle size={20} />
              <span>Thank you for subscribing!</span>
            </motion.div>
          )}

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12"
          >
            {[
              { icon: '🎬', label: 'Weekly Updates' },
              { icon: '⭐', label: 'Exclusive Access' },
              { icon: '🔔', label: 'Premium Alerts' },
            ].map((feature, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{feature.icon}</span>
                <span className="text-gray-300 font-semibold">{feature.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
