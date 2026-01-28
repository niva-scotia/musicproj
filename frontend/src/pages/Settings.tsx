
import { useState } from 'react';
import { useAuth } from '../context/useAuth'
import { usersApi, authApi } from '../lib/api';
import axios from 'axios';
import type { JSX } from 'react';
type Tab = 'profile' | 'password' | 'account';

export default function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile form
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      await usersApi.updateProfile({ displayName, bio, profilePictureUrl });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
if (axios.isAxiosError(err)) {
 setProfileError(err.response?.data?.error || 'Failed to update profile');
  } else if (err instanceof Error) {
 setProfileError(err.message || 'Failed to update profile');
  } else {
    setProfileError('An unexpected error occurred');
  }
     
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {

  if (axios.isAxiosError(err)) {
    setPasswordError(err.response?.data?.message || 'Failed to change password');
  } else if (err instanceof Error) {
    setPasswordError(err.message);
  } else {
    setPasswordError('An unexpected error occurred');
  }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.username) return;
    setIsDeleting(true);
    try {
      await usersApi.deleteAccount();
      await logout();
    } catch {
      console.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: 'password',
      label: 'Password',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      key: 'account',
      label: 'Account',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="sm:w-48 shrink-0">
          <nav className="flex sm:flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left w-full ${
                  activeTab === tab.key
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-6">Edit Profile</h2>

              {profileSuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                  Profile updated successfully!
                </div>
              )}
              {profileError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Avatar preview */}
                <div className="flex items-center gap-4">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="" className="w-20 h-20 rounded-full object-cover" onError={() => setProfilePictureUrl('')} />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      {(displayName?.[0] || user?.username?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    <p className="font-medium text-white">@{user?.username}</p>
                    <p>{user?.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="mt-1 text-xs text-gray-500">{bio.length}/200 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Profile Picture URL</label>
                  <input
                    type="url"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors"
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                  Password changed successfully!
                </div>
              )}
              {passwordError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-400">Passwords don't match</p>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPasswords}
                    onChange={(e) => setShowPasswords(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600"
                  />
                  <span className="text-sm text-gray-400">Show passwords</span>
                </label>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Account info */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
                <dl className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <dt className="text-gray-400">Username</dt>
                    <dd className="text-white">@{user?.username}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <dt className="text-gray-400">Email</dt>
                    <dd className="text-white">{user?.email}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-gray-400">Account Type</dt>
                    <dd className="text-white capitalize">{user?.role || 'User'}</dd>
                  </div>
                </dl>
              </div>

              {/* Danger zone */}
              <div className="bg-gray-900 rounded-xl p-6 border border-red-900/50">
                <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-5 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-white mb-2">Delete Account</h3>
            <p className="text-gray-400 mb-4">
              This will permanently delete your account, reviews, playlists, and all associated data.
            </p>
            <p className="text-gray-400 mb-4">
              Type <span className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">{user?.username}</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter your username"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== user?.username || isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/30 disabled:text-red-300 text-white rounded-lg"
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}