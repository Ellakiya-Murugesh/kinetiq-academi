import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, removeStoredToken } from '../utils/api';

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
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string, explicitRole?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    removeStoredToken();
    apiRequest<{ user: User }>('/api/auth/me')
      .then((data) => {
        if (active) {
          setUser(data.user);
          setSessionVerified(true);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setSessionVerified(false);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const login = async (identifier: string, password: string, explicitRole?: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, role: explicitRole }),
      });
      setUser(data.user);
      setSessionVerified(true);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setSessionVerified(false);
    removeStoredToken();
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((current) => current ? { ...current, ...updatedFields } : current);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: sessionVerified && Boolean(user),
        isLoading,
        login,
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
