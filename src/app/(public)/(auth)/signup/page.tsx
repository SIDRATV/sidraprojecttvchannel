'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AtSign, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authService } from '@/services/auth';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError('Username must be 3–30 characters (letters, numbers, underscores only)');
      return;
    }

    setLoading(true);

    try {
      await authService.signUp(email, password, fullName, username);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
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
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative w-20 h-20 mx-auto mb-6"
            >
              <Image
                src="/sidra-logo.png"
                alt="Sidra Logo"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-2">Join Sidra</h1>
            <p className="text-gray-600 dark:text-gray-400">Create your premium account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg flex items-center gap-2 transition-colors"
            >
              <AlertCircle size={20} className="text-red-700 dark:text-red-400 shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="john_doe"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-colors"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                3–30 characters · letters, numbers and underscores only
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-colors"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 mt-2">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
                required
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link href="#" className="text-brand-700 dark:text-brand-400 hover:underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="#" className="text-brand-700 dark:text-brand-400 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
