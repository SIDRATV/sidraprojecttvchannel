'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Store in localStorage first (demo mode)
      localStorage.setItem('user', JSON.stringify({ email, full_name: email.split('@')[0] }));
      
      try {
        await authService.signIn(email, password);
      } catch (supabaseError) {
        // Demo mode - localStorage already set
        console.debug("Supabase login skipped - demo mode");
      }
      
      // Redirect to app dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-brand-500 to-islamic-teal rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📺</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-400">Sign in to your Sidra account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg flex items-center gap-2 transition-colors"
            >
              <AlertCircle size={20} className="text-red-700 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link href="#" className="text-sm text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              disabled={loading}
              className="w-full mt-6"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold">
              Sign up
            </Link>
          </p>
        </Card>

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-600 mt-6 transition-colors">
          By signing in, you agree to our{' '}
          <Link href="#" className="hover:text-gray-700 dark:hover:text-gray-400">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="#" className="hover:text-gray-700 dark:hover:text-gray-400">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
