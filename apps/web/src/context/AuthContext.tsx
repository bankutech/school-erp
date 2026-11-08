import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UserRoleType, UserSummary, PermissionKey } from '@school-erp/shared';

interface AuthContextType {
  user: UserSummary | null;
  permissions: PermissionKey[];
  isLoading: boolean;
  login: (email: string, password: string, keepSessionActive?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: PermissionKey) => boolean;
  hasRole: (...roles: UserRoleType[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const token = sessionStorage.getItem('school_erp_token') || localStorage.getItem('school_erp_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get<{ success: boolean; user: UserSummary; permissions: PermissionKey[] }>('/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
          setPermissions(res.permissions || []);
        } else {
          sessionStorage.removeItem('school_erp_token');
          localStorage.removeItem('school_erp_token');
        }
      } catch (err) {
        sessionStorage.removeItem('school_erp_token');
        localStorage.removeItem('school_erp_token');
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const login = async (email: string, password: string, keepSessionActive = false) => {
    const res = await api.post<{
      success: boolean;
      token: string;
      user: UserSummary;
      permissions: PermissionKey[];
    }>('/auth/login', { email, password, keepSessionActive });

    if (res.success && res.token) {
      if (keepSessionActive) {
        localStorage.setItem('school_erp_token', res.token);
        sessionStorage.removeItem('school_erp_token');
      } else {
        sessionStorage.setItem('school_erp_token', res.token);
        localStorage.removeItem('school_erp_token');
      }
      setUser(res.user);
      setPermissions(res.permissions || []);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    sessionStorage.removeItem('school_erp_token');
    localStorage.removeItem('school_erp_token');
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false;
    if (user.role === UserRoleType.SUPER_ADMIN) return true;
    return permissions.includes(permission);
  };

  const hasRole = (...roles: UserRoleType[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role as UserRoleType);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
