import React, { useState } from 'react';
import './index.css';

// Simple standalone demo version
const App = () => {
  const [monitors, setMonitors] = useState([
    {
      id: 1,
      name: 'Main Website',
      url: 'https://example.com',
      status: 'online',
      uptime: 99.9,
      responseTime: 145
    },
    {
      id: 2,
      name: 'API Server',
      url: 'https://api.example.com',
      status: 'offline',
      uptime: 98.2,
      responseTime: 0
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMonitor, setNewMonitor] = useState({ name: '', url: '' });

  const addMonitor = (e) => {
    e.preventDefault();
    if (newMonitor.name && newMonitor.url) {
      setMonitors([...monitors, {
        id: Date.now(),
        ...newMonitor,
        status: 'pending',
        uptime: 100,
        responseTime: 0
      }]);
      setNewMonitor({ name: '', url: '' });
      setShowAddForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gradient">Web3 Uptime Monitor</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">Demo Mode</div>
              <button className="btn-primary text-sm">Connect Wallet</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="text-2xl font-bold text-gray-900">{monitors.length}</div>
              <div className="text-sm text-gray-600">Total Monitors</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-2xl font-bold text-green-600">
                {monitors.filter(m => m.status === 'online').length}
              </div>
              <div className="text-sm text-gray-600">Online</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-2xl font-bold text-red-600">
                {monitors.filter(m => m.status === 'offline').length}
              </div>
              <div className="text-sm text-gray-600">Offline</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-2xl font-bold text-gray-900">99.1%</div>
              <div className="text-sm text-gray-600">Avg Uptime</div>
            </div>
          </div>
        </div>

        {/* Monitors */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Monitors</h2>
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Monitor
            </button>
          </div>
          
          <div className="divide-y divide-gray-200">
            {monitors.map((monitor) => (
              <div key={monitor.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      monitor.status === 'online' ? 'bg-green-500' :
                      monitor.status === 'offline' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{monitor.name}</h3>
                      <p className="text-sm text-gray-500">{monitor.url}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{monitor.uptime}%</div>
                      <div className="text-gray-500">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">
                        {monitor.responseTime ? `${monitor.responseTime}ms` : '-'}
                      </div>
                      <div className="text-gray-500">Response</div>
                    </div>
                    <span className={`badge ${
                      monitor.status === 'online' ? 'badge-success' :
                      monitor.status === 'offline' ? 'badge-danger' : 'badge-gray'
                    }`}>
                      {monitor.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Monitor Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Monitor</h3>
              <form onSubmit={addMonitor} className="space-y-4">
                <div>
                  <label className="label">Monitor Name</label>
                  <input
                    type="text"
                    className="input"
                    value={newMonitor.name}
                    onChange={(e) => setNewMonitor({...newMonitor, name: e.target.value})}
                    placeholder="e.g., Main Website"
                    required
                  />
                </div>
                <div>
                  <label className="label">Website URL</label>
                  <input
                    type="url"
                    className="input"
                    value={newMonitor.url}
                    onChange={(e) => setNewMonitor({...newMonitor, url: e.target.value})}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-outline flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Add Monitor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;