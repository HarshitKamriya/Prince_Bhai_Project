import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('levelup_token');
      if (token) {
        const userData = await api.get('/users/me');
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to restore auth session:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (usernameOrEmail, password) => {
    setLoading(true);
    try {
      const { token, user: userData } = await api.post('/auth/login', { usernameOrEmail, password });
      localStorage.setItem('levelup_token', token);
      setUser(userData);
      return userData;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, username, displayName, password) => {
    setLoading(true);
    try {
      const { token, user: userData } = await api.post('/auth/register', { email, username, displayName, password });
      localStorage.setItem('levelup_token', token);
      setUser(userData);
      return userData;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('levelup_token');
    setUser(null);
  };

  const loginWithGoogle = async (googleToken) => {
    setLoading(true);
    try {
      const { token, user: userData } = await api.post('/auth/google-login', { token: googleToken });
      localStorage.setItem('levelup_token', token);
      setUser(userData);
      return userData;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.get('/users/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
