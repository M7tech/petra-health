'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AdminLoginResponse,
  DoctorLoginResponse,
  LoginDto,
} from '@petra/shared';
import { api, getToken, setToken } from './api';

export type Role = 'admin' | 'doctor';

export interface Session {
  role: Role;
  id: string;
  email: string;
  fullName: string;
  subtitle: string; // admin role or doctor specialty
}

interface AuthState {
  session: Session | null;
  loading: boolean;
  login: (dto: LoginDto, role: Role) => Promise<Session>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const SESSION_KEY = 'petra_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_KEY) : null;
    if (token && stored) setSession(JSON.parse(stored));
    setLoading(false);
  }, []);

  async function login(dto: LoginDto, role: Role): Promise<Session> {
    let s: Session;
    if (role === 'admin') {
      const res = await api<AdminLoginResponse>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      setToken(res.accessToken);
      s = {
        role: 'admin',
        id: res.admin.id,
        email: res.admin.email,
        fullName: res.admin.fullName,
        subtitle: res.admin.role,
      };
    } else {
      const res = await api<DoctorLoginResponse>('/auth/doctor/login', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      setToken(res.accessToken);
      s = {
        role: 'doctor',
        id: res.doctor.id,
        email: res.doctor.email,
        fullName: res.doctor.fullName,
        subtitle: res.doctor.specialty ?? 'Doctor',
      };
    }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
    return s;
  }

  function logout() {
    setToken(null);
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
