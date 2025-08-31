import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { MonitorProvider } from './context/MonitorContext';
import { Web3Provider } from './context/Web3Context';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MonitorDetail from './pages/MonitorDetail';
import CreateMonitor from './pages/CreateMonitor';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Web3Provider>
        <AuthProvider>
          <MonitorProvider>
            <Router>
              <div className="App min-h-screen bg-gray-50">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes */}
                  <Route path="/app" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="monitors/:id" element={<MonitorDetail />} />
                    <Route path="monitors/new" element={<CreateMonitor />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  
                  {/* Catch all route */}
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                        <p className="text-gray-600 mb-6">Page not found</p>
                        <a href="/" className="btn-primary">
                          Go Home
                        </a>
                      </div>
                    </div>
                  } />
                </Routes>
                
                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      style: {
                        background: '#10b981',
                      },
                    },
                    error: {
                      style: {
                        background: '#ef4444',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </MonitorProvider>
        </AuthProvider>
      </Web3Provider>
    </ErrorBoundary>
  );
}

export default App;