'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, Loader2, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Supabase automatically picks up the recovery token from the URL hash
    // when the user clicks the email link. We need to wait for the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
        setChecking(false);
      }
    });

    // Also check if there's already a session (user might have already been authenticated)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-400 to-brand-500 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-400/30 dark:bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold-500/20 dark:bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-300/10 dark:bg-brand-400/5 rounded-full blur-3xl" />
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
              <div className="absolute inset-0 bg-brand-400/20 dark:bg-brand-400/10 rounded-full blur-xl animate-pulse-glow" />
              <Image
                src="/sidra-logo.webp"
                alt="Sidra Logo"
                fill
                className="object-contain relative z-10 drop-shadow-lg"
                priority
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-white dark:text-white mb-2">Nouveau mot de passe</h1>
            <p className="text-white/70 dark:text-gray-400">
              Choisissez votre nouveau mot de passe
            </p>
          </div>

          {checking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={32} className="animate-spin text-white/60" />
            </div>
          ) : success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Mot de passe modifié !</h2>
              <p className="text-white/70 dark:text-gray-400 text-sm">
                Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-4 text-sm text-gold-300 dark:text-brand-400 hover:text-gold-200 dark:hover:text-brand-300 font-medium"
              >
                <ArrowLeft size={16} /> Aller à la connexion
              </Link>
            </motion.div>
          ) : !sessionReady ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Lien invalide ou expiré</h2>
              <p className="text-white/70 dark:text-gray-400 text-sm">
                Ce lien de réinitialisation n&apos;est plus valide. Veuillez demander un nouveau lien.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white font-medium hover:bg-white/20 transition-colors"
              >
                Demander un nouveau lien
              </Link>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-2xl flex items-center gap-2"
                >
                  <AlertCircle size={20} className="text-red-300 shrink-0" />
                  <span className="text-sm text-red-200">{error}</span>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 dark:text-gray-300 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-white/40 dark:text-gray-500" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-12 py-2.5 bg-white/10 dark:bg-gray-900 border border-white/20 dark:border-gray-700 rounded-xl text-white dark:text-white placeholder-white/40 dark:placeholder-gray-500 focus:outline-none focus:border-brand-300 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-300/50 dark:focus:ring-brand-400/50 backdrop-blur-sm transition-all"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-white/40 dark:text-gray-500 hover:text-white/70 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-white/40 dark:text-gray-500 mt-1.5">Minimum 6 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 dark:text-gray-300 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-white/40 dark:text-gray-500" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 dark:bg-gray-900 border border-white/20 dark:border-gray-700 rounded-xl text-white dark:text-white placeholder-white/40 dark:placeholder-gray-500 focus:outline-none focus:border-brand-300 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-300/50 dark:focus:ring-brand-400/50 backdrop-blur-sm transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-300 mt-1.5">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || password.length < 6 || password !== confirmPassword}
                  className="w-full mt-6 py-3 px-6 bg-white dark:bg-gradient-to-r dark:from-brand-500 dark:to-brand-400 text-brand-500 dark:text-white font-semibold rounded-xl hover:shadow-glow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Mise à jour…
                    </>
                  ) : (
                    'Mettre à jour le mot de passe'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
