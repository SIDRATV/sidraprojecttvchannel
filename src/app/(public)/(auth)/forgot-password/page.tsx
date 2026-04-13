'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-400/10 dark:bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold-500/5 dark:bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-300/5 dark:bg-brand-400/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative w-24 h-24 mx-auto mb-6"
            >
              <div className="absolute inset-0 bg-brand-400/10 dark:bg-brand-400/10 rounded-full blur-xl animate-pulse-glow" />
              <Image
                src="/sidra-logo.webp"
                alt="Sidra Logo"
                fill
                className="object-contain relative z-10 drop-shadow-lg"
                priority
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mot de passe oublié</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email envoyé !</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Si un compte existe avec l&apos;adresse <span className="font-medium text-gray-900 dark:text-white">{email}</span>,
                vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                Vérifiez également vos dossiers spam/courrier indésirable.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-4 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-medium"
              >
                <ArrowLeft size={16} /> Retour à la connexion
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 rounded-2xl flex items-center gap-2"
                >
                  <AlertCircle size={20} className="text-red-500 dark:text-red-300 shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-200">{error}</span>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500/30 dark:focus:ring-brand-400/50 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 px-6 bg-brand-500 hover:bg-brand-600 dark:bg-gradient-to-r dark:from-brand-500 dark:to-brand-400 text-white font-semibold rounded-xl hover:shadow-glow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    'Envoyer le lien de réinitialisation'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                <Link
                  href="/login"
                  className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-semibold inline-flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
