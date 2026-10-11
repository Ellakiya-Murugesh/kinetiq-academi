import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  getStoredUser,
  setStoredUser,
  apiRequest,
} from '../utils/api';

export type UserRole = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  studentId?: string | null;
  profileCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string, explicitRole?: UserRole) => Promise<User>;
  loginWithOtp: (phone: string, code: string, explicitRole?: UserRole) => Promise<User>;
  loginWithStudentMobileOtp: (phone: string, challengeId: string, code: string) => Promise<User>;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiRequest<{ user: User }>('/api/auth/me');
        setUser(data.user);
        setStoredUser(data.user);
      } catch (err) {
        console.warn('Session verification failed, resetting token.');
        removeStoredToken();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (identifier: string, password: string, explicitRole?: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const loginEndpoint = explicitRole === 'ADMIN' ? '/api/admin-auth/login' : '/api/auth/login';
      const data = await apiRequest<{ token: string; user: User }>(loginEndpoint, {
        method: 'POST',
        body: JSON.stringify({ identifier, password, role: explicitRole }),
      });

      setToken(data.token);
      setUser(data.user);
      setStoredToken(data.token);
      setStoredUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (phone: string, code: string, explicitRole?: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User }>('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code, role: explicitRole }),
      });

      setToken(data.token);
      setUser(data.user);
      setStoredToken(data.token);
      setStoredUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithStudentMobileOtp = async (
    phone: string,
    challengeId: string,
    code: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User }>('/api/auth/student/mobile-otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, challengeId, code }),
      });

      setToken(data.token);
      setUser(data.user);
      setStoredToken(data.token);
      setStoredUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setToken(null);
    try {
      apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    setStoredUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithOtp,
        loginWithStudentMobileOtp,
        logout,
        updateUser,
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
