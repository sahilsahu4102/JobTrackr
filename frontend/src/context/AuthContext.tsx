import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import type { User, MeResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** Guest sessions are created by POST /auth/guest and use an @guest.jobtrackr.app address. */
  isGuest: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('jobtrackr_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get<MeResponse>('/auth/me');
        setUser(data.data.user);
      } catch (error) {
        console.error('Auth verification failed', error);
        localStorage.removeItem('jobtrackr_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('jobtrackr_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('jobtrackr_token');
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isGuest: !!user && user.email.endsWith('@guest.jobtrackr.app'), isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
