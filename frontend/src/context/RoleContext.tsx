import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface AdminUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  roles?: Array<{ id: string; name: string; code: string; permissions?: string[] }>;
}

export interface RoleDefinition {
  id: string;
  name: string;
  title: string;
  color: string;
  badgeBg: string;
  description: string;
  defaultPath: string;
  permissions: string[];
}

export const ROLES: Record<string, RoleDefinition> = {
  ADMIN: {
    id: 'ADMIN',
    name: 'Administrator',
    title: 'Master Administrator & Executive Dispatch',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Complete system oversight: roles & permissions, users, order details, and driver document verification.',
    defaultPath: '/master/dashboard',
    permissions: ['all', '*'],
  },
};

interface RoleContextType {
  currentUser: AdminUser | null;
  currentRole: RoleDefinition;
  userPermissions: string[];
  loginWithBackend: (token: string, user: AdminUser) => void;
  logout: () => void;
  hasRole: (roleKey: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const saved = sessionStorage.getItem('vlt_master_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [currentRole, setCurrentRole] = useState<RoleDefinition>(ROLES.ADMIN);
  const [userPermissions, setUserPermissions] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('vlt_master_permissions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ['all', '*'];
      }
    }
    return ['all', '*'];
  });

  const fetchEffectivePermissions = async (token: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${API_URL}/rbac/my-permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-auth-token': token,
        },
      });
      if (res.data?.data) {
        setUserPermissions(res.data.data);
        sessionStorage.setItem('vlt_master_permissions', JSON.stringify(res.data.data));
      }
    } catch (_) {
      setUserPermissions(['all', '*']);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('vlt_master_token');
    if (token && currentUser) {
      fetchEffectivePermissions(token);
    }
  }, [currentUser]);

  const loginWithBackend = (token: string, user: AdminUser) => {
    sessionStorage.setItem('vlt_master_token', token);
    sessionStorage.setItem('vlt_master_user', JSON.stringify(user));
    setCurrentUser(user);
    fetchEffectivePermissions(token);
  };

  const logout = () => {
    sessionStorage.removeItem('vlt_master_token');
    sessionStorage.removeItem('vlt_master_user');
    sessionStorage.removeItem('vlt_master_role');
    sessionStorage.removeItem('vlt_master_permissions');
    setCurrentUser(null);
  };

  const hasRole = (roleKey: string) => {
    if (!currentUser) return false;
    const roleCode = currentUser.role || currentUser.roles?.[0]?.code || 'ADMIN';
    return roleCode.toUpperCase() === roleKey.toUpperCase() || roleCode.toUpperCase() === 'ADMIN';
  };

  const hasPermission = (permission: string) => {
    if (userPermissions.includes('all') || userPermissions.includes('*')) {
      return true;
    }
    return userPermissions.includes(permission);
  };

  const refreshPermissions = async () => {
    const token = sessionStorage.getItem('vlt_master_token');
    if (token) {
      await fetchEffectivePermissions(token);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        currentRole,
        userPermissions,
        loginWithBackend,
        logout,
        hasRole,
        hasPermission,
        refreshPermissions,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
