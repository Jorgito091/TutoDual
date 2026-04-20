import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as apiLogin } from '../services/api';
import type { AuthToken, UserRole } from '../types';

interface AuthContextType {
  token: string | null;
  role: UserRole | null;
  userId: number | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [role, setRole] = useState<UserRole | null>(() => localStorage.getItem('role') as UserRole | null);
  const [userId, setUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem('user_id');
    return stored ? parseInt(stored) : null;
  });

  const isAuthenticated = !!token;

  const login = async (email: string, password: string) => {
    const data: AuthToken = await apiLogin(email, password);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('user_id', String(data.user_id));
    setToken(data.access_token);
    setRole(data.role);
    setUserId(data.user_id);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    setToken(null);
    setRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, userId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
