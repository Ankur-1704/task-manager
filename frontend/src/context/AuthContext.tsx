import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import {
  getMe,
  login as apiLogin,
  signup as apiSignup,
  verifyEmail as apiVerifyEmail,
} from '../api/auth';

function subjectFromJwt(token: string): string {
  try {
    const segment = token.split('.')[1];
    if (!segment) return '';
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const payload = JSON.parse(atob(base64 + pad));
    return typeof payload.sub === 'string' ? payload.sub : '';
  } catch {
    return '';
  }
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    invitationToken?: string,
  ) => Promise<{
    is_verified: boolean;
    email: string;
    dev_otp?: string | null;
    email_sent?: boolean | null;
  }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    localStorage.setItem('token', res.access_token);
    const me = await getMe();
    setUser(me);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    invitationToken?: string,
  ) => {
    const normalized = email.trim().toLowerCase();
    const res = await apiSignup({
      name: name.trim(),
      email: normalized,
      password,
      invitation_token: invitationToken,
    });
    localStorage.setItem('token', res.access_token);
    try {
      const me = await getMe(true);
      setUser(me);
    } catch {
      const id = subjectFromJwt(res.access_token);
      setUser({
        id: id || `temp:${normalized}`,
        name: name.trim(),
        email: normalized,
        is_verified: false,
        created_at: new Date().toISOString(),
      });
    }
    return {
      is_verified: res.is_verified,
      email: normalized,
      dev_otp: res.dev_otp,
      email_sent: res.email_sent,
    };
  };

  const verifyEmail = async (email: string, otp: string) => {
    const res = await apiVerifyEmail({ email, otp_code: otp });
    localStorage.setItem('token', res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
