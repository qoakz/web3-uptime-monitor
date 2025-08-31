import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const Settings = () => {
  const { user } = useAuth();
  const { account, isConnected } = useWeb3();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className="input"
                  value={user?.firstName || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  value={user?.lastName || ''}
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={user?.email || ''}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Web3 Settings */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Web3 Settings</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Wallet Address</label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  className="input flex-1"
                  value={account || 'Not connected'}
                  readOnly
                />
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              </div>
            </div>
            <div>
              <label className="label">Plan</label>
              <div className="flex items-center space-x-3">
                <span className={`badge ${
                  user?.plan === 'pro' ? 'badge-primary' : 'badge-gray'
                }`}>
                  {user?.plan || 'Free'}
                </span>
                {user?.plan === 'free' && (
                  <button className="btn-primary text-sm">
                    Upgrade to Pro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive email alerts when monitors go down</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                defaultChecked
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Browser Notifications</h3>
                <p className="text-sm text-gray-500">Show desktop notifications in your browser</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
                <p className="text-sm text-gray-500">Receive updates about new features and tips</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* API Access */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">API Access</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">API Key</label>
              <div className="flex items-center space-x-3">
                <input
                  type="password"
                  className="input flex-1"
                  value="sk_1234567890abcdef"
                  readOnly
                />
                <button className="btn-outline">
                  Regenerate
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Use this key to access the Web3 Monitor API
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200">
          <div className="card-header bg-red-50">
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-500">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button className="btn-danger">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;