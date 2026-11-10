import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  register: (data: { username: string; password: string; full_name: string; email?: string; phone?: string }) => Promise<User | null>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await authApi.getCurrentUser();
      setUser(res.data);
      return res.data;
    } catch {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<User | null> => {
    const res = await authApi.login({ username, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    return await fetchCurrentUser();
  };

  const register = async (data: { username: string; password: string; full_name: string; email?: string; phone?: string }): Promise<User | null> => {
    const res = await authApi.register(data);
    if (res.data.tokens) {
      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);
      setUser(res.data.user);
      return res.data.user;
    }
    return null;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
