import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useMonitor } from '../context/MonitorContext';

const StatusIndicator = ({ isUp }) => {
  if (isUp === null) {
    return <div className="status-unknown animate-pulse" />;
  }
  return <div className={isUp ? 'status-up' : 'status-down'} />;
};

const Dashboard = () => {
  const { monitors, loading, stats } = useMonitor();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/app/monitors/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Monitor
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-lg">
                <GlobeAltIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Monitors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="bg-success-100 p-3 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-2xl font-bold text-success-600">{stats.up}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="bg-danger-100 p-3 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-danger-600">{stats.down}</p>
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
                <p className="text-sm font-medium text-gray-600">Avg Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgUptime}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monitors List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Your Monitors</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {monitors.length === 0 ? (
            <div className="p-8 text-center">
              <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No monitors yet</h3>
              <p className="text-gray-600 mb-6">
                Start monitoring your websites by creating your first monitor.
              </p>
              <Link to="/app/monitors/new" className="btn-primary">
                Create Monitor
              </Link>
            </div>
          ) : (
            monitors.map((monitor) => (
              <div key={monitor.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <StatusIndicator isUp={monitor.isUp} />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        <Link 
                          to={`/app/monitors/${monitor.id}`}
                          className="hover:text-primary-600"
                        >
                          {monitor.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-500">{monitor.url}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {monitor.uptime}%
                      </div>
                      <div className="text-gray-500">Uptime</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {monitor.responseTime ? `${monitor.responseTime}ms` : '-'}
                      </div>
                      <div className="text-gray-500">Response</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {monitor.interval}s
                      </div>
                      <div className="text-gray-500">Interval</div>
                    </div>
                    
                    <div className="text-center">
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
                
                {monitor.lastChecked && (
                  <div className="mt-3 text-sm text-gray-500">
                    Last checked: {new Date(monitor.lastChecked).toLocaleString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;