import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Verify token and get user info
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      // In a real app, you would make an API call to verify the token
      // For demo purposes, we'll use mock data
      const mockUser = {
        id: '1',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        walletAddress: '0x1234567890123456789012345678901234567890',
        plan: 'pro'
      };
      setUser(mockUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Mock login - in real app, make API call
      if (email === 'demo@example.com' && password === 'password') {
        const mockToken = 'mock-jwt-token';
        const mockUser = {
          id: '1',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          walletAddress: '0x1234567890123456789012345678901234567890',
          plan: 'pro'
        };
        
        localStorage.setItem('token', mockToken);
        setToken(mockToken);
        setUser(mockUser);
        
        toast.success('Login successful!');
        return true;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Mock registration - in real app, make API call
      const mockToken = 'mock-jwt-token';
      const mockUser = {
        id: '1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        walletAddress: userData.walletAddress,
        plan: 'free'
      };
      
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      setUser(mockUser);
      
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};