import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitor } from '../context/MonitorContext';

const CreateMonitor = () => {
  const navigate = useNavigate();
  const { createMonitor, loading } = useMonitor();
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    interval: 300,
    timeout: 10000,
    retryCount: 3,
    rewardPerCheck: '0.001',
    notifications: {
      email: {
        enabled: true,
        addresses: ['']
      },
      webhook: {
        enabled: false,
        url: ''
      }
    },
    tags: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Filter out empty email addresses
      const cleanedData = {
        ...formData,
        notifications: {
          ...formData.notifications,
          email: {
            ...formData.notifications.email,
            addresses: formData.notifications.email.addresses.filter(email => email.trim())
          }
        }
      };
      
      await createMonitor(cleanedData);
      navigate('/app');
    } catch (error) {
      console.error('Error creating monitor:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: type === 'checkbox' ? checked : value
          } : (type === 'checkbox' ? checked : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const addEmailAddress = () => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        email: {
          ...prev.notifications.email,
          addresses: [...prev.notifications.email.addresses, '']
        }
      }
    }));
  };

  const removeEmailAddress = (index) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        email: {
          ...prev.notifications.email,
          addresses: prev.notifications.email.addresses.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const updateEmailAddress = (index, value) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        email: {
          ...prev.notifications.email,
          addresses: prev.notifications.email.addresses.map((email, i) => 
            i === index ? value : email
          )
        }
      }
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Monitor</h1>
        <p className="text-gray-600 mt-2">
          Set up monitoring for your website with custom intervals and notifications.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="label">
                  Monitor Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="input"
                  placeholder="e.g., Main Website"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="url" className="label">
                  Website URL *
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  required
                  className="input"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="input"
                placeholder="Optional description for this monitor"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Monitoring Settings */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Monitoring Settings</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="interval" className="label">
                  Check Interval (seconds) *
                </label>
                <select
                  id="interval"
                  name="interval"
                  required
                  className="input"
                  value={formData.interval}
                  onChange={handleChange}
                >
                  <option value={60}>1 minute</option>
                  <option value={180}>3 minutes</option>
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                  <option value={1800}>30 minutes</option>
                  <option value={3600}>1 hour</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="timeout" className="label">
                  Timeout (milliseconds) *
                </label>
                <select
                  id="timeout"
                  name="timeout"
                  required
                  className="input"
                  value={formData.timeout}
                  onChange={handleChange}
                >
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                  <option value={15000}>15 seconds</option>
                  <option value={30000}>30 seconds</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="retryCount" className="label">
                  Retry Count
                </label>
                <select
                  id="retryCount"
                  name="retryCount"
                  className="input"
                  value={formData.retryCount}
                  onChange={handleChange}
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="rewardPerCheck" className="label">
                Reward per Check (UMT tokens) *
              </label>
              <input
                type="number"
                id="rewardPerCheck"
                name="rewardPerCheck"
                min="0.001"
                step="0.001"
                required
                className="input"
                placeholder="0.001"
                value={formData.rewardPerCheck}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                Amount of tokens to reward monitoring nodes per check
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="card-body space-y-6">
            {/* Email Notifications */}
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="emailEnabled"
                  name="notifications.email.enabled"
                  checked={formData.notifications.email.enabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="emailEnabled" className="ml-2 text-sm font-medium text-gray-900">
                  Email Notifications
                </label>
              </div>
              
              {formData.notifications.email.enabled && (
                <div className="space-y-2">
                  {formData.notifications.email.addresses.map((email, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="email"
                        placeholder="email@example.com"
                        className="input flex-1"
                        value={email}
                        onChange={(e) => updateEmailAddress(index, e.target.value)}
                      />
                      {formData.notifications.email.addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmailAddress(index)}
                          className="btn-danger px-3 py-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEmailAddress}
                    className="btn-outline text-sm"
                  >
                    Add Email Address
                  </button>
                </div>
              )}
            </div>

            {/* Webhook Notifications */}
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="webhookEnabled"
                  name="notifications.webhook.enabled"
                  checked={formData.notifications.webhook.enabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="webhookEnabled" className="ml-2 text-sm font-medium text-gray-900">
                  Webhook Notifications
                </label>
              </div>
              
              {formData.notifications.webhook.enabled && (
                <input
                  type="url"
                  name="notifications.webhook.url"
                  placeholder="https://your-webhook-url.com"
                  className="input"
                  value={formData.notifications.webhook.url}
                  onChange={handleChange}
                />
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Monitor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMonitor;