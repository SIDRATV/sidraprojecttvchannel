'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Loader2, AlertCircle, KeyRound, LogOut } from 'lucide-react';

interface AdminKeyGateProps {
  children: React.ReactNode;
}

export function AdminKeyGate({ children }: AdminKeyGateProps) {
  const [status, setStatus] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/verify-key', { method: 'GET', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.authenticated ? 'unlocked' : 'locked');
      } else {
        setStatus('locked');
      }
    } catch {
      setStatus('locked');
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setStatus('unlocked');
        setKey('');
      } else {
        setError(data.error || 'Invalid admin key. Access denied.');
        setKey('');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/verify-key', { method: 'DELETE', credentials: 'include' });
    } catch {}
    setStatus('locked');
    setKey('');
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-brand-400" />
          <p className="text-slate-400 text-sm">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (status === 'unlocked') {
    return (
      <div className="relative">
        {/* Sign-out button overlay */}
        <div className="fixed top-4 right-4 z-[100]">
          <button
            onClick={handleSignOut}
            title="Sign out of admin"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-red-500/20 border border-slate-700/50 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-lg text-xs font-medium transition-all backdrop-blur"
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Glass card */}
          <div className="bg-slate-900/80 border border-slate-700/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl shadow-slate-950/50">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/40 px-8 pt-10 pb-8 border-b border-slate-700/50 text-center">
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/30">
                  <Shield size={36} className="text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                This area is restricted. Enter your admin key to continue.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <KeyRound size={14} className="text-brand-400" />
                  Admin Secret Key
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={key}
                    onChange={e => { setKey(e.target.value); setError(''); }}
                    placeholder="Enter admin key…"
                    autoComplete="off"
                    autoFocus
                    className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-3 pl-10 pr-12 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading || !key.trim()}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-brand-500/20 transition-all duration-200 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    Access Admin Panel
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="px-8 pb-6 text-center">
              <p className="text-slate-600 text-xs">
                Unauthorized access attempts are logged and may result in account suspension.
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
