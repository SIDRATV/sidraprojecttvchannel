'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Power,
  PowerOff,
  Save,
  Loader2,
  UserPlus,
  UserMinus,
  Search,
  AlertTriangle,
  CheckCircle,
  Shield,
  Users,
  MessageSquare,
  Eye,
} from 'lucide-react';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  exempt_user_ids: string[];
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

export function AdminMaintenanceManager({ token }: { token: string }) {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    message: 'Nous sommes en maintenance, nous reviendrons bientôt. Merci pour votre patience.',
    exempt_user_ids: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // User search for exemption
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [exemptUsers, setExemptUsers] = useState<UserProfile[]>([]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/maintenance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        // Fetch exempt user profiles
        if (data.exempt_user_ids?.length > 0) {
          fetchExemptUsers(data.exempt_user_ids);
        }
      }
    } catch {
      setError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchExemptUsers = async (userIds: string[]) => {
    try {
      const res = await fetch(`/api/admin/users?ids=${userIds.join(',')}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExemptUsers(Array.isArray(data) ? data : data.users || []);
      }
    } catch {
      // Silently fail - we still have the IDs
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const toggleMaintenance = async () => {
    setToggling(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !settings.enabled }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
        setSuccess(!settings.enabled ? 'Mode maintenance activé' : 'Mode maintenance désactivé');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erreur lors du changement de statut');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setToggling(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: settings.message,
          exempt_user_ids: settings.exempt_user_ids,
        }),
      });
      if (res.ok) {
        setSuccess('Paramètres sauvegardés');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const users = Array.isArray(data) ? data : data.users || [];
        // Filter out already exempt users
        setSearchResults(users.filter((u: UserProfile) => !settings.exempt_user_ids.includes(u.id)));
      }
    } catch {
      // Ignore search errors
    } finally {
      setSearching(false);
    }
  };

  const addExemptUser = (user: UserProfile) => {
    if (!settings.exempt_user_ids.includes(user.id)) {
      setSettings((prev) => ({
        ...prev,
        exempt_user_ids: [...prev.exempt_user_ids, user.id],
      }));
      setExemptUsers((prev) => [...prev, user]);
      setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
    }
  };

  const removeExemptUser = (userId: string) => {
    setSettings((prev) => ({
      ...prev,
      exempt_user_ids: prev.exempt_user_ids.filter((id) => id !== userId),
    }));
    setExemptUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-500/10 rounded-xl">
          <Wrench className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Mode Maintenance</h2>
          <p className="text-slate-400 text-sm">Gérez le mode maintenance et les utilisateurs exemptés</p>
        </div>
      </div>

      {/* Status alerts */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400"
          >
            <CheckCircle size={16} />
            <span className="text-sm">{success}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
          >
            <AlertTriangle size={16} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle */}
      <div className={`rounded-2xl border p-6 transition-all ${
        settings.enabled
          ? 'bg-red-500/5 border-red-500/30'
          : 'bg-slate-800/30 border-slate-700/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                scale: settings.enabled ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 2, repeat: settings.enabled ? Infinity : 0 }}
              className={`p-4 rounded-xl ${
                settings.enabled ? 'bg-red-500/20' : 'bg-slate-700/50'
              }`}
            >
              {settings.enabled ? (
                <PowerOff className="w-8 h-8 text-red-400" />
              ) : (
                <Power className="w-8 h-8 text-green-400" />
              )}
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {settings.enabled ? 'Maintenance Active' : 'Site en Ligne'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {settings.enabled
                  ? 'Le site est en mode maintenance. Les utilisateurs voient la page de maintenance.'
                  : 'Le site fonctionne normalement. Tous les utilisateurs ont accès.'}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleMaintenance}
            disabled={toggling}
            className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
              settings.enabled
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            }`}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : settings.enabled ? (
              <Power size={16} />
            ) : (
              <PowerOff size={16} />
            )}
            {settings.enabled ? 'Désactiver la Maintenance' : 'Activer la Maintenance'}
          </motion.button>
        </div>

        {settings.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-red-500/20"
          >
            <div className="flex items-center gap-2 text-orange-400 text-sm">
              <AlertTriangle size={14} />
              <span>
                Les utilisateurs non-exemptés sont redirigés vers la page de maintenance.
                Les admins et utilisateurs exemptés peuvent toujours accéder au site.
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Custom Message */}
      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-brand-400" />
          <h3 className="text-lg font-semibold text-white">Message de Maintenance</h3>
        </div>
        <textarea
          value={settings.message}
          onChange={(e) => setSettings((prev) => ({ ...prev, message: e.target.value }))}
          rows={3}
          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 resize-none"
          placeholder="Message à afficher pendant la maintenance..."
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-slate-500">
            Ce message sera affiché sur la page de maintenance
          </p>
          <a
            href="/maintenance"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            <Eye size={12} />
            Prévisualiser
          </a>
        </div>
      </div>

      {/* Exempt Users */}
      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Utilisateurs Exemptés</h3>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            {settings.exempt_user_ids.length} utilisateur{settings.exempt_user_ids.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Ces utilisateurs pourront accéder au site normalement pendant la maintenance pour tester l&apos;application.
        </p>

        {/* Search users */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              placeholder="Rechercher un utilisateur par nom ou email..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={searchUsers}
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2.5 bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 border border-brand-500/30 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={14} />}
            Chercher
          </motion.button>
        </div>

        {/* Search results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-slate-900/50 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50 overflow-hidden"
            >
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs text-white font-medium">
                      {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{user.username || 'Sans nom'}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addExemptUser(user)}
                    className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                  >
                    <UserPlus size={14} />
                  </motion.button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current exempt users list */}
        {exemptUsers.length > 0 ? (
          <div className="space-y-2">
            {exemptUsers.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between px-4 py-3 bg-purple-500/5 border border-purple-500/20 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-xs text-purple-400 font-medium">
                    {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{user.username || 'Sans nom'}</p>
                    <p className="text-xs text-slate-400">{user.email || user.id}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeExemptUser(user.id)}
                  className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <UserMinus size={14} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        ) : settings.exempt_user_ids.length > 0 ? (
          // Show IDs if we couldn't load profiles
          <div className="space-y-2">
            {settings.exempt_user_ids.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between px-4 py-3 bg-purple-500/5 border border-purple-500/20 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Users size={14} className="text-purple-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{id}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeExemptUser(id)}
                  className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <UserMinus size={14} />
                </motion.button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            Aucun utilisateur exempté. Recherchez des utilisateurs pour les ajouter.
          </div>
        )}
      </div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={saveSettings}
        disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
        Sauvegarder les Paramètres
      </motion.button>
    </div>
  );
}
