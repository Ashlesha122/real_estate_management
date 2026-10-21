import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { UserPublic, UserRole } from '../types';

interface AuthContextType {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone: string; role: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  updateUser: (user: UserPublic) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { setIsLoading(false); return; }
      const { data } = await api.get('/users/me');
      setUser(data);
    } catch {
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const register = async (regData: { email: string; password: string; fullName: string; phone: string; role: UserRole }) => {
    const { data } = await api.post('/auth/register', regData);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const verifyOtp = async (code: string) => {
    const { data } = await api.post('/auth/verify-otp', { code });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(prev => prev ? { ...prev, phoneVerified: true } : null);
  };

  const resendOtp = async () => { await api.post('/auth/resend-otp'); };
  const updateUser = (u: UserPublic) => setUser(u);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, verifyOtp, resendOtp, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
