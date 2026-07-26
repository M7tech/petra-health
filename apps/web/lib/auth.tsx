'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AdminLoginResponse,
  DoctorLoginResponse,
  OtpChallengeResponse,
} from '@petra/shared';
import { api, getToken, setToken } from './api';

export type Role = 'admin' | 'doctor';

export interface Session {
  role: Role;
  id: string;
  email: string;
  fullName: string;
  subtitle: string; // admin role / office, or doctor specialty
  isSuperAdmin: boolean;
}

interface AuthState {
  session: Session | null;
  loading: boolean;
  // Doctor: single step. Admin: request OTP, then verify.
  doctorLogin: (email: string, password: string) => Promise<Session>;
  adminRequestOtp: (username: string, password: string) => Promise<OtpChallengeResponse>;
  adminVerifyOtp: (username: string, otp: string, rememberMe: boolean) => Promise<Session>;
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

  function persist(s: Session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  }

  async function doctorLogin(email: string, password: string): Promise<Session> {
    const res = await api<DoctorLoginResponse>('/auth/doctor/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.accessToken);
    const s: Session = {
      role: 'doctor',
      id: res.doctor.id,
      email: res.doctor.email,
      fullName: res.doctor.fullName,
      subtitle: res.doctor.specialty ?? 'Doctor',
      isSuperAdmin: false,
    };
    persist(s);
    return s;
  }

  async function adminRequestOtp(username: string, password: string) {
    return api<OtpChallengeResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async function adminVerifyOtp(username: string, otp: string, rememberMe: boolean): Promise<Session> {
    const res = await api<AdminLoginResponse>('/auth/admin/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ username, otp, rememberMe }),
    });
    setToken(res.accessToken);
    const s: Session = {
      role: 'admin',
      id: res.admin.id,
      email: res.admin.email,
      fullName: res.admin.fullName,
      subtitle: res.admin.officeName || res.admin.role,
      isSuperAdmin: res.admin.role === 'SUPERADMIN',
    };
    persist(s);
    return s;
  }

  function logout() {
    setToken(null);
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, doctorLogin, adminRequestOtp, adminVerifyOtp, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
