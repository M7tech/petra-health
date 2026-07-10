'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminLoginResponse, AuthAdmin, LoginDto } from '@petra/shared';
import { api, getToken, setToken } from './api';

interface AuthState {
  admin: AuthAdmin | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const ADMIN_KEY = 'petra_admin';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AuthAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Rehydrate from localStorage on mount.
    const token = getToken();
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(ADMIN_KEY) : null;
    if (token && stored) setAdmin(JSON.parse(stored));
    setLoading(false);
  }, []);

  async function login(dto: LoginDto) {
    const res = await api<AdminLoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    setToken(res.accessToken);
    window.localStorage.setItem(ADMIN_KEY, JSON.stringify(res.admin));
    setAdmin(res.admin);
  }

  function logout() {
    setToken(null);
    window.localStorage.removeItem(ADMIN_KEY);
    setAdmin(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
