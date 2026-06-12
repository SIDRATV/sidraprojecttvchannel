'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface SplashSettings {
  enabled: boolean;
  duration: number;
  title: string;
  slogan: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImage: string;
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
  backgroundType: 'gradient',
  backgroundColor: '#000000',
  backgroundGradient: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, rgba(217, 119, 6, 0.08) 30%, rgba(15, 23, 42, 0.95) 100%)',
  backgroundImage: '',
  textColor: '#ffffff',
  showParticles: true,
  showFooter: true,
  footerText: 'Powered by SidraChain',
};

const GRADIENT_PRESETS = [
  { name: 'Sidra (Défaut)', value: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, rgba(217, 119, 6, 0.08) 30%, rgba(15, 23, 42, 0.95) 100%)' },
  { name: 'Noir pur', value: 'linear-gradient(180deg, #000000 0%, #000000 100%)' },
  { name: 'Vert foncé', value: 'radial-gradient(circle at center, #0f4c3a 0%, #051e17 100%)' },
  { name: 'Or élégant', value: 'radial-gradient(circle at center, #2d1f0f 0%, #0a0604 100%)' },
  { name: 'Bleu nuit', value: 'radial-gradient(circle at center, #1a3a52 0%, #0a1929 100%)' },
  { name: 'Violet profond', value: 'radial-gradient(circle at center, #2d1b4e 0%, #0f0a1e 100%)' },
];

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

          {/* Background Type */}
          <div>
            <label className="block text-white font-medium mb-2">Type de fond</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => setSettings({ ...settings, backgroundType: 'solid' })}
                className={`px-4 py-2 rounded-lg transition ${
                  settings.backgroundType === 'solid'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Couleur unie
              </button>
              <button
                onClick={() => setSettings({ ...settings, backgroundType: 'gradient' })}
                className={`px-4 py-2 rounded-lg transition ${
                  settings.backgroundType === 'gradient'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Dégradé
              </button>
              <button
                onClick={() => setSettings({ ...settings, backgroundType: 'image' })}
                className={`px-4 py-2 rounded-lg transition ${
                  settings.backgroundType === 'image'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Image
              </button>
            </div>

            {/* Solid Color */}
            {settings.backgroundType === 'solid' && (
              <div className="flex gap-3">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
            )}

            {/* Gradient Presets */}
            {settings.backgroundType === 'gradient' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Choisir un dégradé</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSettings({ ...settings, backgroundGradient: preset.value })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                        settings.backgroundGradient === preset.value
                          ? 'border-green-500 text-white'
                          : 'border-gray-700 text-gray-300 hover:border-gray-600'
                      }`}
                      style={{ background: preset.value }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image URL */}
            {settings.backgroundType === 'image' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">URL de l'image</label>
                <input
                  type="text"
                  value={settings.backgroundImage}
                  onChange={(e) => setSettings({ ...settings, backgroundImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
            )}

            {/* Preview */}
            <div
              className="mt-3 h-20 rounded-lg border border-gray-700"
              style={{
                background:
                  settings.backgroundType === 'solid'
                    ? settings.backgroundColor
                    : settings.backgroundType === 'gradient'
                    ? settings.backgroundGradient
                    : settings.backgroundImage
                    ? `url(${settings.backgroundImage}) center/cover`
                    : '#000',
              }}
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
