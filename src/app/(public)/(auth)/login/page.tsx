'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.signIn(identifier, password);

      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Invalid credentials. Please try again.'
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-gray-500 dark:text-gray-400">Sign in to your Sidra account</p>
          </div>

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
            {/* Email or Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com or username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500/30 dark:focus:ring-brand-400/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500/30 dark:focus:ring-brand-400/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 accent-brand-500"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-6 bg-brand-500 hover:bg-brand-600 dark:bg-gradient-to-r dark:from-brand-500 dark:to-brand-400 text-white font-semibold rounded-xl hover:shadow-glow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-semibold"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-400 dark:text-gray-600 mt-6">
          By signing in, you agree to our{' '}
          <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-400">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-400">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
