'use client';

import { motion } from 'framer-motion';
import { Mail, MessageCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg text-center"
      >
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 dark:bg-brand-400/10 mb-6">
          <MessageCircle size={32} className="text-brand-500 dark:text-brand-400" />
        </div>

        <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-3">
          Contactez-nous
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Notre équipe est disponible pour répondre à toutes vos questions
          concernant votre compte, vos paiements ou la plateforme.
        </p>

        {/* Email card */}
        <a
          href="mailto:support@sidraproject.com"
          className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-brand-400/50 dark:hover:border-brand-500/40 transition-all group mb-4"
        >
          <div className="p-3 bg-brand-500/10 dark:bg-brand-400/10 rounded-xl group-hover:bg-brand-500/20 transition-colors">
            <Mail size={22} className="text-brand-500 dark:text-brand-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-950 dark:text-white text-sm">Email support</p>
            <p className="text-brand-600 dark:text-brand-400 text-sm">support@sidraproject.com</p>
          </div>
        </a>

        {/* Response time */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-sm text-amber-700 dark:text-amber-400 mb-8">
          <Clock size={16} className="shrink-0" />
          <span>Délai de réponse habituel : 24 à 48 heures</span>
        </div>

        <Link
          href="/login"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          ← Retour à la connexion
        </Link>
      </motion.div>
    </div>
  );
}
