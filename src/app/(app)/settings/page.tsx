'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Bell, Lock, Volume2, Eye, Moon, AlertCircle, LogOut, Trash2 } from 'lucide-react';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gray-100 dark:bg-gray-800/30 rounded-lg border border-gray-300 dark:border-gray-700 transition-colors"
    >
      <h3 className="font-bold text-lg text-gray-950 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>}
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function SettingToggle({
  label,
  description,
  defaultValue = false,
}: {
  label: string;
  description?: string;
  defaultValue?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultValue);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-sm text-gray-950 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>}
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setEnabled(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-700'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 0 }}
          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
        />
      </motion.button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = async () => {
    try {
      await authService.signOut();
      localStorage.removeItem('user');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveSettings = () => {
    setSuccessMessage('Settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-4xl bg-white dark:bg-gray-950 min-h-screen transition-colors">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-gray-950 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
      </motion.div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-100 dark:bg-green-500/20 border border-green-300 dark:border-green-500/30 rounded-lg text-green-700 dark:text-green-400 text-sm transition-colors"
        >
          ✓ {successMessage}
        </motion.div>
      )}

      {/* Video Settings */}
      <SettingsSection
        title="Video Settings"
        description="Adjust your viewing experience"
      >
        <SettingToggle
          label="Autoplay next video"
          description="Automatically play the next video in a series"
          defaultValue={true}
        />
        <SettingToggle
          label="Autoplay similar content"
          description="Continue playback with similar videos"
          defaultValue={false}
        />
        <div className="pt-2 border-t border-gray-700">
          <label className="block text-sm font-medium mb-2">
            Default playback quality
          </label>
          <select className="w-full md:w-48 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none transition-colors">
            <option>Auto (recommended)</option>
            <option>1080p</option>
            <option>720p</option>
            <option>480p</option>
          </select>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        title="Notifications"
        description="Control how and when you're notified"
      >
        <SettingToggle
          label="Push notifications"
          description="Receive notifications on your device"
          defaultValue={true}
        />
        <SettingToggle
          label="Email notifications"
          description="Receive email updates about new content"
          defaultValue={true}
        />
        <SettingToggle
          label="New video alerts"
          description="Get notified when channels you follow post new videos"
          defaultValue={true}
        />
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection title="Privacy & Safety" description="Manage your privacy settings">
        <SettingToggle
          label="Profile visibility"
          description="Allow others to see your profile"
          defaultValue={true}
        />
        <SettingToggle
          label="Show watch history"
          description="Display your watch history in your profile"
          defaultValue={false}
        />
        <SettingToggle
          label="Allow recommendations"
          description="Help improve recommendations by sharing viewing patterns"
          defaultValue={true}
        />
      </SettingsSection>

      {/* Display */}
      <SettingsSection title="Display" description="Customize your viewing experience">
        <div className="space-y-3">
          <p className="text-sm font-medium">Theme</p>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="theme" defaultChecked className="w-4 h-4" />
              <span className="text-sm">Dark (Default)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="theme" className="w-4 h-4" />
              <span className="text-sm">Light</span>
            </label>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <label className="block text-sm font-medium mb-2">Font size</label>
          <select className="w-full md:w-48 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:border-blue-500 outline-none transition-colors">
            <option>Small</option>
            <option>Normal (default)</option>
            <option>Large</option>
            <option>Very Large</option>
          </select>
        </div>
      </SettingsSection>

      {/* Security */}
      <SettingsSection
        title="Security"
        description="Protect your account and data"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <Lock size={18} />
            <div>
              <p className="font-medium text-sm">Change password</p>
              <p className="text-xs text-gray-400">Update your password regularly</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </motion.button>

        <SettingToggle
          label="Two-factor authentication"
          description="Add an extra layer of security"
          defaultValue={false}
        />
      </SettingsSection>

      {/* Data & Storage */}
      <SettingsSection title="Data & Storage" description="Manage your data and storage">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-left"
        >
          <div>
            <p className="font-medium text-sm">Clear watch history</p>
            <p className="text-xs text-gray-400">Remove all watched videos from history</p>
          </div>
          <span className="text-gray-400">→</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-left"
        >
          <div>
            <p className="font-medium text-sm">Download my data</p>
            <p className="text-xs text-gray-400">Export all your personal data</p>
          </div>
          <span className="text-gray-400">→</span>
        </motion.button>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection
        title="Danger Zone"
        description="Irreversible actions - handle with care"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-left text-red-400"
        >
          <div className="flex items-center space-x-3">
            <Trash2 size={18} />
            <div>
              <p className="font-medium text-sm">Delete account</p>
              <p className="text-xs text-red-400/70">
                Permanently delete your account and all data
              </p>
            </div>
          </div>
          <span>→</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-colors text-left text-orange-400"
        >
          <div className="flex items-center space-x-3">
            <LogOut size={18} />
            <div>
              <p className="font-medium text-sm">Logout from this device</p>
              <p className="text-xs text-orange-400/70">Sign out of your current session</p>
            </div>
          </div>
          <span>→</span>
        </motion.button>
      </SettingsSection>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSaveSettings}
        className="w-full md:w-48 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
      >
        Save Changes
      </motion.button>
    </div>
  );
}
