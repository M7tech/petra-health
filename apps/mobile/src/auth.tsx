import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, getToken } from './api';
import type { AuthUser, UserLoginResponse } from './types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          setUser(await api<AuthUser>('/profile/me'));
        } catch {
          await setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await api<UserLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setToken(res.accessToken);
    setUser(res.user);
  }

  async function signup(email: string, password: string, fullName: string) {
    const res = await api<UserLoginResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
    await setToken(res.accessToken);
    setUser(res.user);
  }

  async function refresh() {
    setUser(await api<AuthUser>('/profile/me'));
  }

  async function logout() {
    await setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
