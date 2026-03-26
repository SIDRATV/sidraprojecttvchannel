'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Edit, Check, X, Shield, Mail, Calendar, MoreVertical, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  last_login: string;
  avatar_url?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    { id: '1', email: 'john@example.com', full_name: 'John Doe', role: 'admin', status: 'active', created_at: '2024-01-15', last_login: '2 hours ago', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
    { id: '2', email: 'jane@example.com', full_name: 'Jane Smith', role: 'moderator', status: 'active', created_at: '2024-02-20', last_login: '30 mins ago', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
    { id: '3', email: 'bob@example.com', full_name: 'Bob Johnson', role: 'user', status: 'active', created_at: '2024-03-10', last_login: '1 day ago', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
    { id: '4', email: 'alice@example.com', full_name: 'Alice Brown', role: 'user', status: 'inactive', created_at: '2024-01-05', last_login: '5 days ago', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
    { id: '5', email: 'charlie@example.com', full_name: 'Charlie Wilson', role: 'user', status: 'banned', created_at: '2024-02-01', last_login: 'Never', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter users based on search
  useEffect(() => {
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const toggleUserSelection = (id: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    setShowDeleteModal(null);
    setSelectedUsers(new Set(Array.from(selectedUsers).filter(s => s !== id)));
  };

  const updateUserRole = (userId: string, newRole: 'user' | 'admin' | 'moderator') => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setEditingUser(null);
  };

  const updateUserStatus = (userId: string, newStatus: 'active' | 'inactive' | 'banned') => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
  };

  const bulkDelete = () => {
    setUsers(users.filter(u => !selectedUsers.has(u.id)));
    setSelectedUsers(new Set());
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moderator':
        return 'bg-brand-500/20 text-brand-400 border-brand-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'banned':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">User Management</h2>
            <p className="text-gray-400 text-sm mt-1">{filteredUsers.length} users total</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <UserPlus size={18} />
            Add User
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-brand-500/10 border border-brand-500/30 rounded-lg p-4 flex items-center justify-between"
          >
            <span className="text-white font-medium">{selectedUsers.size} user(s) selected</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={bulkDelete}
              className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg font-medium transition-all"
            >
              <Trash2 size={16} className="inline mr-2" />
              Delete Selected
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table - Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <Card className="bg-gray-800/30 border border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleAllUsers}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th className="px-6 py-4 text-left text-gray-300 font-semibold">User</th>
                <th className="px-6 py-4 text-left text-gray-300 font-semibold">Role</th>
                <th className="px-6 py-4 text-left text-gray-300 font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-gray-300 font-semibold">Joined</th>
                <th className="px-6 py-4 text-left text-gray-300 font-semibold">Last Login</th>
                <th className="px-6 py-4 text-right text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-gray-700 hover:bg-gray-700/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium">{user.full_name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                      className={`px-3 py-1 rounded-lg border text-sm font-medium bg-transparent cursor-pointer transition-all ${getRoleColor(user.role)}`}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.status}
                      onChange={(e) => updateUserStatus(user.id, e.target.value as any)}
                      className={`px-3 py-1 rounded-lg border text-sm font-medium bg-transparent cursor-pointer transition-all ${getStatusColor(user.status)}`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="banned">Banned</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{user.created_at}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{user.last_login}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowDeleteModal(user.id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                        title="Delete user"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                  className="w-4 h-4 rounded"
                />
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-medium">{user.full_name}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowDeleteModal(user.id)}
                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
              >
                <Trash2 size={18} />
              </motion.button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={user.role}
                onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium bg-transparent border cursor-pointer ${getRoleColor(user.role)}`}
              >
                <option value="user">User</option>
                <option value="moderator">Mod</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={user.status}
                onChange={(e) => updateUserStatus(user.id, e.target.value as any)}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium bg-transparent border cursor-pointer ${getStatusColor(user.status)}`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>📅 {user.created_at}</span>
              <span>⏰ {user.last_login}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm w-full space-y-4"
            >
              <h3 className="text-lg font-bold text-white">Delete User?</h3>
              <p className="text-gray-400">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => deleteUser(showDeleteModal)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
