import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useMonitor } from '../context/MonitorContext';

const MonitorDetail = () => {
  const { id } = useParams();
  const { getMonitor } = useMonitor();
  
  const monitor = getMonitor(id);

  if (!monitor) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Monitor Not Found</h1>
          <Link to="/app" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link 
            to="/app" 
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              monitor.isUp === null ? 'bg-gray-400 animate-pulse' :
              monitor.isUp ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <h1 className="text-2xl font-bold text-gray-900">{monitor.name}</h1>
          </div>
        </div>
        <p className="text-gray-600">{monitor.url}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                monitor.isUp === null ? 'bg-gray-100' :
                monitor.isUp ? 'bg-success-100' : 'bg-danger-100'
              }`}>
                {monitor.isUp === null ? (
                  <ClockIcon className="h-6 w-6 text-gray-600" />
                ) : monitor.isUp ? (
                  <CheckCircleIcon className="h-6 w-6 text-success-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-danger-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className={`text-lg font-bold ${
                  monitor.isUp === null ? 'text-gray-600' :
                  monitor.isUp ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {monitor.isUp === null ? 'Unknown' : monitor.isUp ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-lg">
                <ClockIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-lg font-bold text-gray-900">{monitor.uptime}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <GlobeAltIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-lg font-bold text-gray-900">
                  {monitor.responseTime ? `${monitor.responseTime}ms` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <CogIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Check Interval</p>
                <p className="text-lg font-bold text-gray-900">{monitor.interval}s</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monitor Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Monitor Name</label>
                  <p className="text-gray-900">{monitor.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">URL</label>
                  <p className="text-gray-900 break-all">{monitor.url}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Check Interval</label>
                  <p className="text-gray-900">{monitor.interval} seconds</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`badge ${
                    monitor.status === 'active' ? 'badge-success' :
                    monitor.status === 'paused' ? 'badge-warning' :
                    'badge-gray'
                  }`}>
                    {monitor.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {monitor.lastChecked ? (
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      monitor.isUp ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm text-gray-900">
                        Last check: {monitor.isUp ? 'Online' : 'Offline'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(monitor.lastChecked).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No checks performed yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="card-body space-y-3">
              <button className="btn-primary w-full">
                Edit Monitor
              </button>
              <button className="btn-warning w-full">
                {monitor.status === 'active' ? 'Pause' : 'Resume'}
              </button>
              <button className="btn-outline w-full">
                Test Now
              </button>
              <button className="btn-danger w-full">
                Delete Monitor
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Email</span>
                  <span className={`badge ${
                    monitor.notifications.email.enabled ? 'badge-success' : 'badge-gray'
                  }`}>
                    {monitor.notifications.email.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {monitor.notifications.email.enabled && (
                  <div className="mt-2">
                    {monitor.notifications.email.addresses.map((email, index) => (
                      <p key={index} className="text-sm text-gray-600">{email}</p>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Webhook</span>
                  <span className={`badge ${
                    monitor.notifications.webhook.enabled ? 'badge-success' : 'badge-gray'
                  }`}>
                    {monitor.notifications.webhook.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {monitor.notifications.webhook.enabled && (
                  <p className="text-sm text-gray-600 mt-2 break-all">
                    {monitor.notifications.webhook.url}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Blockchain Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Blockchain</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Contract ID</label>
                <p className="text-sm text-gray-900 font-mono">
                  {monitor.contractRequestId || 'Pending...'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Monitoring Nodes</label>
                <p className="text-sm text-gray-900">3 active</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Reward per Check</label>
                <p className="text-sm text-gray-900">0.001 UMT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorDetail;