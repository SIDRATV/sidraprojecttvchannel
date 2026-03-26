'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-6"
        >
          <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
        </motion.div>

        <h1 className="text-4xl font-bold text-gray-950 dark:text-white mb-2">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">Page not found</p>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold transition-colors"
        >
          Go back home
        </Link>
      </motion.div>
    </div>
  );
}
