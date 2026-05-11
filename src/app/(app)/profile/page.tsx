'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, Trophy, Clock, Edit2, Package, Save, X, Upload, Settings, Bell, Lock, LogOut, Shield, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBuildInfo } from '@/hooks/useBuildInfo';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ContentSection } from '@/components/app/ContentSection';
import { useProfile } from '@/providers/ProfileProvider';
import { supabase } from '@/lib/supabase';


interface ProfileData {
  fullName: string;
  bio: string;
  profilePhoto: string | null;
  accountTier: 'free' | 'premium' | 'pro' | 'vip';
  emailNotifications: boolean;
  contentNotifications: boolean;
  weeklyDigest: boolean;
  memberSince: string;
}

export default function ProfilePage() {
  const { user, session } = useAuth();
  const { buildInfo, loading } = useBuildInfo();
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'enrolling'>('idle');
  const [twoFactorQR, setTwoFactorQR] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorFactorId, setTwoFactorFactorId] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: user?.full_name || 'User',
    bio: user?.bio || '',
    profilePhoto: user?.avatar_url || null,
    accountTier: 'free',
    emailNotifications: true,
    contentNotifications: true,
    weeklyDigest: false,
    memberSince: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
  });
  const [editData, setEditData] = useState<ProfileData>(profileData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile data when user loads
  useEffect(() => {
    if (user) {
      // Use DB premium_plan as source of truth
      const dbTier = (user.premium_plan as ProfileData['accountTier']) || 'free';
      const data: ProfileData = {
        fullName: user.full_name || user.username || user.email?.split('@')[0] || 'User',
        bio: user.bio || '',
        profilePhoto: user.avatar_url || null,
        accountTier: dbTier,
        emailNotifications: true,
        contentNotifications: true,
        weeklyDigest: false,
        memberSince: user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      };
      setProfileData(data);
      setEditData(data);
    }
  }, [user]);

  // Check 2FA status
  useEffect(() => {
    async function check2FA() {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data?.totp && data.totp.length > 0) {
        setTwoFactorEnabled(true);
        setTwoFactorFactorId(data.totp[0].id);
      }
    }
    if (user) check2FA();
  }, [user]);

  // Save profile to Supabase
  const handleSaveProfile = async () => {
    try {
      if (user?.id) {
        await authService.updateProfile(user.id, {
          full_name: editData.fullName,
          bio: editData.bio,
          avatar_url: editData.profilePhoto || undefined,
        });
      }
      updateProfile(editData);
      setProfileData(editData);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Handle profile photo upload → Cloudflare R2
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.access_token) return;

    setUploadingPhoto(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setEditData(prev => ({ ...prev, profilePhoto: json.url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-400';
      case 'pro':
        return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-700 dark:text-purple-400';
      case 'vip':
        return 'bg-gradient-to-r from-brand-500/20 to-gold-500/20 border-brand-500/30 text-brand-600 dark:text-brand-400';
      default:
        return 'bg-brand-500/20 border-brand-500/30 text-brand-600 dark:text-brand-400';
    }
  };

  const handleLogoutConfirm = async () => {
    try {
      await authService.signOut();
      localStorage.removeItem('user');
      localStorage.removeItem('userProfile');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.new.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    // In a real app, this would call an API to change password
    setPasswordSuccess('Password changed successfully!');
    setPasswordData({ current: '', new: '', confirm: '' });
    setTimeout(() => {
      setShowPasswordChange(false);
      setPasswordSuccess('');
    }, 2000);
  };

  const handleEnable2FA = async () => {
    setTwoFactorError('');
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error || !data) { setTwoFactorError("Erreur lors de l'activation. Réessayez."); return; }
    setTwoFactorFactorId(data.id);
    setTwoFactorQR(data.totp.qr_code);
    setTwoFactorSecret(data.totp.secret);
    setTwoFactorStep('enrolling');
  };

  const handleVerify2FA = async () => {
    setTwoFactorError('');
    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: twoFactorFactorId });
    if (challengeErr || !challengeData) { setTwoFactorError('Erreur de vérification. Réessayez.'); return; }
    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId: twoFactorFactorId, challengeId: challengeData.id, code: twoFactorCode });
    if (verifyErr) { setTwoFactorError('Code incorrect. Réessayez.'); return; }
    setTwoFactorEnabled(true);
    setTwoFactorStep('idle');
    setShowTwoFactor(false);
    setTwoFactorCode('');
    setTwoFactorSecret('');
    // Notify user
    await (supabase as any).rpc('create_notification', {
      p_user_id: user?.id,
      p_type: 'system',
      p_title: 'Double authentification activée',
      p_message: 'La vérification en deux étapes est maintenant active sur votre compte.',
      p_icon: 'shield',
      p_link: '/profile',
    });
  };

  const handleDisable2FA = async () => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: twoFactorFactorId });
    if (error) { setTwoFactorError('Erreur lors de la désactivation.'); return; }
    setTwoFactorEnabled(false);
    setTwoFactorFactorId('');
    setShowTwoFactor(false);
    // Notify user
    await (supabase as any).rpc('create_notification', {
      p_user_id: user?.id,
      p_type: 'system',
      p_title: 'Double authentification désactivée',
      p_message: 'La vérification en deux étapes a été retirée de votre compte.',
      p_icon: 'shield-off',
      p_link: '/profile',
    });
  };

  const stats = [
    { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', icon: '📅', color: 'from-brand-500 to-cyan-500' },
    { label: 'Username', value: user?.username ? `@${user.username}` : '—', icon: '👤', color: 'from-purple-500 to-pink-500' },
    { label: 'Account', value: user?.is_admin ? 'Admin' : 'Member', icon: '⭐', color: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      {/* Save success toast */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 bg-green-500 text-white rounded-xl shadow-2xl font-semibold text-sm"
        >
          ✓ Profil mis à jour avec succès !
        </motion.div>
      )}
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Animated Background Banner */}
        <div className="relative h-48 rounded-3xl overflow-hidden mb-8 shadow-2xl">
          {/* Base gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Animated overlay with multiple gradients */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-l from-cyan-400/30 to-brand-500/30"
            animate={{
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Radial gradient elements */}
          <motion.div
            className="absolute top-0 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-40 h-40 bg-yellow-300/10 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Text overlay "My Profile" */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-2">
                My Profile
              </h2>
              <motion.div
                className="h-1 bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100px' }}
                transition={{ delay: 0.4, duration: 0.6 }}
                style={{ margin: '0 auto' }}
              />
            </motion.div>
          </div>

          {/* Corner decorative elements */}
          <motion.div
            className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <motion.div
            className="absolute bottom-4 left-4 w-2 h-2 bg-white rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
            }}
          />
        </div>

        {/* Profile Card */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 -mt-24 relative z-20 px-4 md:px-0">
          {/* Avatar Section */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            whileHover={{ scale: 1.08 }}
            className="relative group flex-shrink-0"
          >
            <motion.div
              className="w-40 h-40 bg-gradient-to-br from-brand-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden border-6 border-white dark:border-gray-950"
              whileHover={{
                boxShadow: '0 0 60px rgba(59, 130, 246, 0.8)',
              }}
            >
              {(isEditing ? editData.profilePhoto : profileData.profilePhoto) ? (
                <img src={(isEditing ? editData.profilePhoto : profileData.profilePhoto)!} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={80} className="text-white" />
              )}
            </motion.div>

            {/* Upload overlay — always visible when editing */}
            {isEditing && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                {uploadingPhoto ? (
                  <>
                    <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-xs font-semibold">Envoi en cours…</span>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-white" />
                    <span className="text-white text-xs font-semibold">Ajouter une photo</span>
                    <span className="text-white/70 text-[10px]">↑ Cliquez ici</span>
                  </>
                )}
              </motion.button>
            )}
            {uploadError && (
              <p className="absolute -bottom-6 left-0 right-0 text-center text-xs text-red-500">{uploadError}</p>
            )}

            {/* Camera badge — always visible when not editing and no photo */}
            {!isEditing && !profileData.profilePhoto && (
              <motion.button
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                onClick={() => setIsEditing(true)}
                title="Ajouter une photo de profil"
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-950"
              >
                <Camera size={18} className="text-white" />
              </motion.button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </motion.div>

          {/* Info Section */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editData.fullName}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  className="text-3xl font-bold bg-transparent border-b-2 border-brand-500 focus:outline-none text-gray-950 dark:text-white w-full"
                  placeholder="Your Name"
                />
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Add a bio..."
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {profileData.fullName}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{profileData.bio}</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">Member since {profileData.memberSince}</p>
              </>
            )}

            {/* Tier Badge */}
            <div className="mt-4 flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getTierBadgeColor(profileData.accountTier)}`}>
                {profileData.accountTier.toUpperCase()} Account
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.email}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center gap-3">
              {isEditing ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Save size={18} />
                    <span>Save Changes</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsEditing(false);
                      setEditData(profileData);
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    <X size={18} />
                    <span>Cancel</span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors font-semibold"
                >
                  <Edit2 size={18} />
                  <span>Edit Profile</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ y: -5 }}
            className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg text-white shadow-md flex items-center gap-3`}
          >
            <div className="text-xl flex-shrink-0">{stat.icon}</div>
            <div>
              <p className="text-xs opacity-80">{stat.label}</p>
              <p className="text-sm font-bold leading-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Account & Preferences */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <Lock size={24} className="text-brand-500 dark:text-brand-400" />
              <h3 className="font-bold text-lg">Account Information</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email Address</p>
                    <p className="font-semibold text-gray-950 dark:text-white">{user?.email}</p>
                  </div>
                </div>
                <span className="text-green-600 text-sm font-semibold">Verified</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                    <p className="font-semibold text-gray-950 dark:text-white">{profileData.memberSince}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Trophy size={18} className="text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Account Status</p>
                    <p className="font-semibold text-gray-950 dark:text-white capitalize">{profileData.accountTier}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notification Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell size={24} className="text-brand-500 dark:text-brand-400" />
              <h3 className="font-bold text-lg">Notification Preferences</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={editData.emailNotifications}
                  onChange={(e) => setEditData({ ...editData, emailNotifications: e.target.checked })}
                  className="w-5 h-5 rounded accent-brand-500 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-950 dark:text-white">Email Recommendations</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get personalized content suggestions</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={editData.contentNotifications}
                  onChange={(e) => setEditData({ ...editData, contentNotifications: e.target.checked })}
                  className="w-5 h-5 rounded accent-brand-500 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-950 dark:text-white">New Content Alerts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notify me about new videos and updates</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={editData.weeklyDigest}
                  onChange={(e) => setEditData({ ...editData, weeklyDigest: e.target.checked })}
                  className="w-5 h-5 rounded accent-brand-500 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-950 dark:text-white">Weekly Digest</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive a summary of the week's highlights</p>
                </div>
              </label>
            </div>
            {isEditing && (
              <button
                onClick={handleSaveProfile}
                className="mt-4 w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold transition-colors"
              >
                Save Preferences
              </button>
            )}
          </motion.div>
        </div>

        {/* Right Column - App Info & More */}
        <div className="space-y-6">
          {/* App Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-gradient-to-br from-brand-500/10 to-purple-600/10 dark:from-brand-500/5 dark:to-purple-600/5 rounded-xl border border-brand-500/20 dark:border-brand-600/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <Package size={24} className="text-brand-500 dark:text-brand-400" />
              <h3 className="font-bold text-lg">App Version</h3>
            </div>
            {loading ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
            ) : buildInfo ? (
              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Version</p>
                  <p className="font-semibold text-gray-950 dark:text-white">v{buildInfo.version}</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Build Date</p>
                  <p className="font-semibold text-gray-950 dark:text-white text-sm">{buildInfo.buildTime}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">Unable to load version info</p>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3"
          >
            <h3 className="font-bold text-lg mb-4">Account Settings</h3>
            <button
              onClick={() => setShowPasswordChange(true)}
              className="w-full p-3 text-left font-semibold text-gray-950 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Lock size={18} />
              <span className="flex-1">Changer le mot de passe</span>
            </button>
            <button
              onClick={() => setShowTwoFactor(true)}
              className="w-full p-3 text-left font-semibold text-gray-950 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Shield size={18} className="text-purple-500" />
              <span className="flex-1">Authentification 2FA</span>
              {twoFactorEnabled && (
                <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Activé</span>
              )}
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full p-3 text-left font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </motion.div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">😢</div>
              <h3 className="text-2xl font-bold text-gray-950 dark:text-white mb-2">Are you leaving?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">We'll miss you! Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-950 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogoutConfirm();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPasswordChange(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-950 dark:text-white">Change Password</h3>
              <button
                onClick={() => setShowPasswordChange(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg mb-4 text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 rounded-lg mb-4 text-sm">
                {passwordSuccess}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordChange(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-950 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors"
              >
                Change
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Watch history will be shown here when viewing history table is available */}

      {/* 2FA Modal */}
      {showTwoFactor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => { setShowTwoFactor(false); setTwoFactorStep('idle'); setTwoFactorError(''); setTwoFactorCode(''); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-purple-500" />
                <h3 className="text-xl font-bold text-gray-950 dark:text-white">Authentification 2FA</h3>
              </div>
              <button
                onClick={() => { setShowTwoFactor(false); setTwoFactorStep('idle'); setTwoFactorError(''); setTwoFactorCode(''); setTwoFactorSecret(''); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {twoFactorEnabled ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Shield size={32} className="text-green-500" />
                </div>
                <p className="text-gray-700 dark:text-gray-300">La 2FA est <strong className="text-green-600">activée</strong> sur votre compte.</p>
                {twoFactorError && <p className="text-sm text-red-500">{twoFactorError}</p>}
                <button
                  onClick={handleDisable2FA}
                  className="w-full py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                >
                  Désactiver la 2FA
                </button>
              </div>
            ) : twoFactorStep === 'idle' ? (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Renforcez la sécurité de votre compte avec une application d'authentification (Google Authenticator, Authy...).
                </p>
                <button
                  onClick={handleEnable2FA}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Activer la 2FA
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Scannez ce QR code avec votre application d'authentification :</p>
                {twoFactorQR && (
                  <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-200">
                    <img src={twoFactorQR} alt="QR Code 2FA" className="w-40 h-40" />
                  </div>
                )}
                {twoFactorSecret && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Clé secrète (saisie manuelle)
                    </p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white break-all tracking-wider select-all">
                      {twoFactorSecret}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      Si vous ne pouvez pas scanner le QR, entrez cette clé manuellement dans votre application.
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">Code de vérification</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="000000"
                  />
                </div>
                {twoFactorError && <p className="text-sm text-red-500">{twoFactorError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setTwoFactorStep('idle'); setTwoFactorError(''); setTwoFactorSecret(''); }}
                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-950 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleVerify2FA}
                    disabled={twoFactorCode.length !== 6}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                  >
                    Vérifier
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
