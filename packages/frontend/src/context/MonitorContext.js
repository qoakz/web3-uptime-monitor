import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const MonitorContext = createContext();

export const useMonitor = () => {
  const context = useContext(MonitorContext);
  if (!context) {
    throw new Error('useMonitor must be used within a MonitorProvider');
  }
  return context;
};

export const MonitorProvider = ({ children }) => {
  const { user } = useAuth();
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    up: 0,
    down: 0,
    avgUptime: 100
  });

  // Mock data for demonstration
  const mockMonitors = [
    {
      id: '1',
      name: 'Main Website',
      url: 'https://example.com',
      status: 'active',
      isUp: true,
      uptime: 99.9,
      lastChecked: new Date(),
      responseTime: 156,
      interval: 300,
      notifications: {
        email: { enabled: true, addresses: ['user@example.com'] },
        webhook: { enabled: false, url: '' }
      }
    },
    {
      id: '2',
      name: 'API Server',
      url: 'https://api.example.com',
      status: 'active',
      isUp: false,
      uptime: 98.5,
      lastChecked: new Date(),
      responseTime: 0,
      interval: 180,
      notifications: {
        email: { enabled: true, addresses: ['admin@example.com'] },
        webhook: { enabled: true, url: 'https://hooks.slack.com/...' }
      }
    },
    {
      id: '3',
      name: 'Documentation',
      url: 'https://docs.example.com',
      status: 'active',
      isUp: true,
      uptime: 100,
      lastChecked: new Date(),
      responseTime: 89,
      interval: 600,
      notifications: {
        email: { enabled: false, addresses: [] },
        webhook: { enabled: false, url: '' }
      }
    }
  ];

  useEffect(() => {
    if (user) {
      fetchMonitors();
    }
  }, [user]);

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      
      // Mock API call - in real app, fetch from backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMonitors(mockMonitors);
      
      // Calculate stats
      const total = mockMonitors.length;
      const active = mockMonitors.filter(m => m.status === 'active').length;
      const up = mockMonitors.filter(m => m.isUp).length;
      const down = mockMonitors.filter(m => !m.isUp).length;
      const avgUptime = mockMonitors.reduce((sum, m) => sum + m.uptime, 0) / total;
      
      setStats({ total, active, up, down, avgUptime: Math.round(avgUptime * 100) / 100 });
      
    } catch (error) {
      console.error('Error fetching monitors:', error);
      toast.error('Failed to fetch monitors');
    } finally {
      setLoading(false);
    }
  };

  const getMonitor = (id) => {
    return monitors.find(monitor => monitor.id === id);
  };

  const createMonitor = async (monitorData) => {
    try {
      setLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMonitor = {
        id: Date.now().toString(),
        ...monitorData,
        status: 'active',
        isUp: null,
        uptime: 100,
        lastChecked: null,
        responseTime: null
      };
      
      setMonitors(prev => [...prev, newMonitor]);
      toast.success('Monitor created successfully!');
      
      return newMonitor;
    } catch (error) {
      console.error('Error creating monitor:', error);
      toast.error('Failed to create monitor');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMonitor = async (id, updates) => {
    try {
      setLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMonitors(prev => 
        prev.map(monitor => 
          monitor.id === id ? { ...monitor, ...updates } : monitor
        )
      );
      
      toast.success('Monitor updated successfully!');
    } catch (error) {
      console.error('Error updating monitor:', error);
      toast.error('Failed to update monitor');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteMonitor = async (id) => {
    try {
      setLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMonitors(prev => prev.filter(monitor => monitor.id !== id));
      toast.success('Monitor deleted successfully!');
    } catch (error) {
      console.error('Error deleting monitor:', error);
      toast.error('Failed to delete monitor');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitor = async (id) => {
    try {
      const monitor = getMonitor(id);
      if (!monitor) return;
      
      const newStatus = monitor.status === 'active' ? 'paused' : 'active';
      await updateMonitor(id, { status: newStatus });
      
    } catch (error) {
      console.error('Error toggling monitor:', error);
      throw error;
    }
  };

  const testNotification = async (id, type) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Test ${type} notification sent!`);
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
      throw error;
    }
  };

  const value = {
    monitors,
    loading,
    stats,
    getMonitor,
    createMonitor,
    updateMonitor,
    deleteMonitor,
    toggleMonitor,
    testNotification,
    refreshMonitors: fetchMonitors
  };

  return (
    <MonitorContext.Provider value={value}>
      {children}
    </MonitorContext.Provider>
  );
};