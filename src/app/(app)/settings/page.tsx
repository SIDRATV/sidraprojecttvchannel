'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Bell, Lock, Volume2, Eye, Moon, AlertCircle, LogOut, Trash2, ShieldAlert, Clock, X } from 'lucide-react';
import { authService } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
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
  storageKey,
  onChange,
}: {
  label: string;
  description?: string;
  defaultValue?: boolean;
  storageKey?: string;
  onChange?: (val: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(defaultValue);

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setEnabled(saved === 'true');
    }
  }, [storageKey]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (storageKey) localStorage.setItem(storageKey, String(next));
    if (onChange) onChange(next);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-sm text-gray-950 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>}
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => toggle()}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-brand-500' : 'bg-gray-400 dark:bg-gray-700'
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
  const { session, user } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirm1, setDeleteConfirm1] = useState(false);
  const [deleteConfirm2, setDeleteConfirm2] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletionStatus, setDeletionStatus] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const updateNotificationsEnabled = useCallback(async (val: boolean) => {
    if (!session?.access_token) return;
    try {
      await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: val }),
      });
    } catch {}
  }, [session?.access_token]);

  // Fetch deletion status on mount
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/account/delete', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.json())
      .then(data => { if (data.pending) setDeletionStatus(data); })
      .catch(() => {});
  }, [session?.access_token]);

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

  const handleRequestDeletion = async () => {
    if (!deleteConfirm1 || !deleteConfirm2) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'request', reason: deleteReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la demande');
      setDeletionStatus({
        pending: true,
        scheduledAt: data.scheduled_at,
        daysRemaining: 7,
        canCancel: true,
        cancelDeadline: data.cancel_deadline,
      });
      setShowDeleteModal(false);
      setDeleteConfirm1(false);
      setDeleteConfirm2(false);
      setDeleteReason('');
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'annulation');
      setDeletionStatus(null);
      setSuccessMessage('Demande de suppression annulée avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setCancelLoading(false);
    }
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
          <select className="w-full md:w-48 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:border-brand-500 outline-none transition-colors">
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
        <div className="space-y-4">
          <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-lg p-3">
            <p className="text-xs text-brand-700 dark:text-brand-300">
              💡 Les notifications internes apparaissent dans l'app avec un badge rouge et disparaissent après consultation.
            </p>
          </div>
          
          <SettingToggle
            label="Notifications internes activées"
            description="Activer/désactiver toutes les notifications internes dans l'app"
            defaultValue={true}
            storageKey="settings_push_notifications"
            onChange={updateNotificationsEnabled}
          />
          
          <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-950 dark:text-white mb-3">Types de notifications:</p>
            <SettingToggle
              label="Nouvelles vidéos"
              description="Soyez averti quand une nouvelle vidéo est uploadée"
              defaultValue={true}
              storageKey="settings_notif_new_video"
            />
          </div>

          <SettingToggle
            label="Transactions du portefeuille"
            description="Notifications pour les dépôts, retraits et paiements"
            defaultValue={true}
            storageKey="settings_notif_transactions"
          />

          <SettingToggle
            label="Abonnements premium"
            description="Notifications d'activation, expiration et renouvellement d'abonnement"
            defaultValue={true}
            storageKey="settings_notif_subscriptions"
          />

          <SettingToggle
            label="Alertes système"
            description="Notifications importantes du système et de sécurité"
            defaultValue={true}
            storageKey="settings_notif_system"
          />
        </div>
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
          <select className="w-full md:w-48 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:border-brand-500 outline-none transition-colors">
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
        title="Zone Dangereuse"
        description="Actions irréversibles - à manipuler avec précaution"
      >
        {/* Deletion pending banner */}
        {deletionStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-red-400" />
              <p className="font-bold text-red-400">Suppression programmée</p>
            </div>
            <p className="text-sm text-red-300 mb-1">
              Votre compte sera supprimé le{' '}
              <span className="font-bold">
                {new Date(deletionStatus.scheduledAt).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </p>
            <p className="text-xs text-gray-400 mb-3">
              {deletionStatus.canCancel
                ? 'Vous pouvez encore annuler cette demande.'
                : 'Le délai d\'annulation est dépassé. Contactez le support pour annuler.'}
            </p>
            {deletionStatus.canCancel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelDeletion}
                disabled={cancelLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {cancelLoading ? 'Annulation...' : 'Annuler la suppression'}
              </motion.button>
            )}
          </motion.div>
        )}

        {!deletionStatus && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-left text-red-400"
          >
            <div className="flex items-center space-x-3">
              <Trash2 size={18} />
              <div>
                <p className="font-medium text-sm">Supprimer le compte</p>
                <p className="text-xs text-red-400/70">
                  Suppression définitive de votre compte et de toutes vos données
                </p>
              </div>
            </div>
            <span>→</span>
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-colors text-left text-orange-400"
        >
          <div className="flex items-center space-x-3">
            <LogOut size={18} />
            <div>
              <p className="font-medium text-sm">Se déconnecter</p>
              <p className="text-xs text-orange-400/70">Déconnexion de la session actuelle</p>
            </div>
          </div>
          <span>→</span>
        </motion.button>
      </SettingsSection>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-900 border border-red-500/30 rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={22} className="text-red-500" />
                  <h3 className="text-lg font-bold text-white">Supprimer votre compte</h3>
                </div>
                <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="text-sm text-gray-300 space-y-2">
                <p className="text-red-400 font-medium">⚠️ Cette action est irréversible après 5 jours.</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                  <li>Toutes vos vidéos, commentaires et likes seront supprimés</li>
                  <li>Votre portefeuille et vos transactions seront effacés</li>
                  <li>Votre abonnement premium sera annulé</li>
                  <li>Un délai de 7 jours avant suppression définitive</li>
                  <li>Annulation possible dans les 5 premiers jours</li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteConfirm1}
                    onChange={e => setDeleteConfirm1(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-500"
                  />
                  <span className="text-sm text-gray-300">
                    Je comprends que cette action supprimera définitivement mon compte et toutes mes données
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteConfirm2}
                    onChange={e => setDeleteConfirm2(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-500"
                  />
                  <span className="text-sm text-gray-300">
                    Je confirme vouloir supprimer mon compte et j&apos;accepte les conditions ci-dessus
                  </span>
                </label>
              </div>

              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Raison de la suppression (optionnel)"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-red-500 outline-none resize-none"
                rows={2}
              />

              {deleteError && (
                <p className="text-sm text-red-400">{deleteError}</p>
              )}

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRequestDeletion}
                  disabled={!deleteConfirm1 || !deleteConfirm2 || deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? 'Traitement...' : 'Confirmer la suppression'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSaveSettings}
        className="w-full md:w-48 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold transition-colors"
      >
        Save Changes
      </motion.button>
    </div>
  );
}
