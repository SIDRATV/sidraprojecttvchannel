'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface PremiumFAQProps {
  faqs: FAQItem[];
}

export default function PremiumFAQ({ faqs }: PremiumFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.4 }}
          viewport={{ once: true }}
          className="border border-blue-500/20 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors"
        >
          <motion.button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="w-full p-4 flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold text-white text-left">{item.question}</span>
            <motion.div
              animate={{ rotate: openIndex === idx ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="text-blue-400" size={20} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {openIndex === idx && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900/50 border-t border-blue-500/20"
              >
                <p className="p-4 text-gray-300 leading-relaxed">{item.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
