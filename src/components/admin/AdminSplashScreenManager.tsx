'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface SplashSettings {
  enabled: boolean;
  duration: number;
  title: string;
  slogan: string;
  backgroundColor: string;
  textColor: string;
  showParticles: boolean;
  showFooter: boolean;
  footerText: string;
}

const DEFAULT_SETTINGS: SplashSettings = {
  enabled: true,
  duration: 4,
  title: 'SIDRA PROJECTS TV CHANNEL',
  slogan: "L'information à la source",
  backgroundColor: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, rgba(217, 119, 6, 0.08) 30%, rgba(15, 23, 42, 0.95) 100%)',
  textColor: '#ffffff',
  showParticles: true,
  showFooter: true,
  footerText: 'Powered by SidraChain',
};

export function AdminSplashScreenManager() {
  const { user, session } = useAuth();
  const [settings, setSettings] = useState<SplashSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/splash-screen');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch splash settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/splash-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Splash screen settings updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-6"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Splash Screen Settings</h2>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-900/20 border border-green-500 text-green-300'
                : 'bg-red-900/20 border border-red-500 text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <label className="text-white font-medium">Enable Splash Screen</label>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`px-4 py-2 rounded-lg transition ${
                settings.enabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {settings.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-white font-medium mb-2">Duration (seconds)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.duration}
              onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-white font-medium mb-2">Title</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Slogan */}
          <div>
            <label className="block text-white font-medium mb-2">Slogan</label>
            <input
              type="text"
              value={settings.slogan}
              onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Background */}
          <div>
            <label className="block text-white font-medium mb-2">Background Gradient</label>
            <textarea
              value={settings.backgroundColor}
              onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 font-mono text-sm"
            />
            <div
              className="mt-2 h-16 rounded-lg border border-gray-700"
              style={{ background: settings.backgroundColor }}
            />
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-white font-medium mb-2">Text Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Show Particles */}
          <div className="flex items-center justify-between">
            <label className="text-white font-medium">Show Particle Effects</label>
            <button
              onClick={() => setSettings({ ...settings, showParticles: !settings.showParticles })}
              className={`px-4 py-2 rounded-lg transition ${
                settings.showParticles
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {settings.showParticles ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Show Footer */}
          <div className="flex items-center justify-between">
            <label className="text-white font-medium">Show Footer Text</label>
            <button
              onClick={() => setSettings({ ...settings, showFooter: !settings.showFooter })}
              className={`px-4 py-2 rounded-lg transition ${
                settings.showFooter
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {settings.showFooter ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Footer Text */}
          <div>
            <label className="block text-white font-medium mb-2">Footer Text</label>
            <input
              type="text"
              value={settings.footerText}
              onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
