'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, Trophy, Clock, Edit2, Package, Save, X, Upload, Settings, Bell, Lock, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBuildInfo } from '@/hooks/useBuildInfo';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ContentSection } from '@/components/app/ContentSection';
import { useProfile } from '@/providers/ProfileProvider';

const watchHistory = [
  {
    id: '1',
    title: 'The Legacy of Innovation',
    image: 'https://images.unsplash.com/photo-1542744173-8e90f7e3912d?w=400&h=600&fit=crop',
    duration: '58:32',
    category: 'Documentary',
  },
  {
    id: '2',
    title: 'Understanding Blockchain',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop',
    duration: '48:23',
    category: 'Tutorial',
  },
  {
    id: '3',
    title: 'Future of Islamic Finance',
    image: 'https://images.unsplash.com/photo-1542744173-8e90f7e3912d?w=400&h=600&fit=crop',
    duration: '45:30',
    category: 'Finance',
  },
  {
    id: '4',
    title: 'Community Impact Stories',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop',
    duration: '52:15',
    category: 'Documentary',
  },
];

interface ProfileData {
  fullName: string;
  bio: string;
  profilePhoto: string | null;
  accountTier: 'free' | 'premium' | 'pro';
  emailNotifications: boolean;
  contentNotifications: boolean;
  weeklyDigest: boolean;
  memberSince: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { buildInfo, loading } = useBuildInfo();
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: user?.full_name || 'User',
    bio: 'Passionate about Islamic media and innovative projects',
    profilePhoto: null,
    accountTier: 'free',
    emailNotifications: true,
    contentNotifications: true,
    weeklyDigest: false,
    memberSince: 'January 15, 2024',
  });
  const [editData, setEditData] = useState<ProfileData>(profileData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile data from localStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfileData(parsed);
        setEditData(parsed);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  // Save profile to localStorage and update context
  const handleSaveProfile = () => {
    try {
      updateProfile(editData);
      setProfileData(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
  };

  // Handle profile photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({
          ...editData,
          profilePhoto: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-400';
      case 'pro':
        return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-400';
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

  const stats = [
    { label: 'Videos Watched', value: '127', icon: '▶️', color: 'from-blue-500 to-cyan-500' },
    { label: 'Watch Time', value: '342 hrs', icon: '⏱️', color: 'from-purple-500 to-pink-500' },
    { label: 'Favorites', value: '34', icon: '⭐', color: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white dark:bg-gray-950 min-h-screen transition-colors">
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
            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
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
            className="absolute inset-0 bg-gradient-to-l from-cyan-400/30 to-blue-600/30"
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
              className="w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden border-6 border-white dark:border-gray-950"
              whileHover={{
                boxShadow: '0 0 60px rgba(59, 130, 246, 0.8)',
              }}
            >
              {profileData.profilePhoto ? (
                <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={80} className="text-white" />
              )}
            </motion.div>
            {isEditing && (
              <motion.button
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Upload size={32} className="text-white" />
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
                  className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-950 dark:text-white w-full"
                  placeholder="Your Name"
                />
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
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
            className={`p-6 bg-gradient-to-br ${stat.color} rounded-lg text-white shadow-lg`}
          >
            <div className="text-3xl mb-3">{stat.icon}</div>
            <p className="text-sm opacity-90">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
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
              <Lock size={24} className="text-blue-600 dark:text-blue-400" />
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
              <Bell size={24} className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-lg">Notification Preferences</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={editData.emailNotifications}
                  onChange={(e) => setEditData({ ...editData, emailNotifications: e.target.checked })}
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
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
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
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
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
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
                className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
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
            className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-blue-500/5 dark:to-purple-600/5 rounded-xl border border-blue-500/20 dark:border-blue-700/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <Package size={24} className="text-blue-600 dark:text-blue-400" />
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
              Change Password
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
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Change
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Watch History */}
      {watchHistory.length > 0 && (
        <ContentSection
          title="Your Watch History"
          description="Videos you've recently watched"
          items={watchHistory.slice(0, 5)}
        />
      )}
    </div>
  );
}
