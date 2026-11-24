import React, { createContext, useContext, useState, useEffect } from 'react';

// Single Unified Master Admin Role with full privileges to modify roles/permissions and view/verify documents
export const ROLES = {
  ADMIN: {
    id: 'ADMIN',
    name: 'Administrator',
    title: 'Master Administrator & Compliance Officer',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Complete system oversight: modify roles and permissions, manage staff, and inspect & verify all driver onboarding documents.',
    defaultPath: '/master/dashboard/admin',
    permissions: [
      'all',
      '*',
      // Roles & Permissions Management
      'role:read',
      'role:create',
      'role:update',
      'role:delete',
      'role:manage',
      'staff:read',
      'staff:manage',
      'permissions:manage',
      'audit:read',
      // Document Verification & Compliance
      'documents:read',
      'documents:verify',
      'documents:reject',
      'documents:download',
      'verification:read',
      'verification:write',
      'verification:manage',
      'onboarding:read',
      'onboarding:write',
      'onboarding:manage',
      'drivers:read',
      'drivers:verify',
      'drivers:approve',
      // Core Operations & Finance
      'rides:read',
      'rides:manage',
      'finance:read',
      'finance:manage',
      'tickets:manage',
      'analytics:view'
    ]
  }
};

// Master Admin profile
export const DEMO_PROFILES = [
  {
    roleId: 'ADMIN',
    name: 'Master Administrator',
    email: 'admin@drivemate.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    department: 'Executive Administration & Compliance',
    badge: 'Master Admin'
  }
];

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('vlt_master_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return DEMO_PROFILES[0];
  });

  const [currentRole, setCurrentRole] = useState(() => {
    const savedRoleId = sessionStorage.getItem('vlt_master_role');
    if (savedRoleId && ROLES[savedRoleId]) {
      return ROLES[savedRoleId];
    }
    return ROLES.ADMIN;
  });

  useEffect(() => {
    if (currentRole) {
      sessionStorage.setItem('vlt_master_role', currentRole.id);
    }
    if (currentUser) {
      sessionStorage.setItem('vlt_master_user', JSON.stringify(currentUser));
    }
  }, [currentRole, currentUser]);

  const switchRole = (roleKeyOrId) => {
    const targetRole = Object.values(ROLES).find(
      r => r.id === roleKeyOrId || r.name.toLowerCase() === String(roleKeyOrId).toLowerCase()
    ) || ROLES.ADMIN;

    setCurrentRole(targetRole);
    const matchedProfile = DEMO_PROFILES.find(p => p.roleId === targetRole.id) || DEMO_PROFILES[0];
    setCurrentUser(matchedProfile);
    return targetRole;
  };

  const loginAsDemo = (profile) => {
    const role = ROLES[profile?.roleId] || ROLES.ADMIN;
    const targetProfile = profile || DEMO_PROFILES[0];
    setCurrentRole(role);
    setCurrentUser(targetProfile);
    sessionStorage.setItem('vlt_master_token', `admin_token_${Date.now()}`);
    sessionStorage.setItem('vlt_master_user', JSON.stringify(targetProfile));
    sessionStorage.setItem('vlt_master_role', role.id);
    return role;
  };

  const logout = () => {
    sessionStorage.removeItem('vlt_master_token');
    sessionStorage.removeItem('vlt_master_user');
    sessionStorage.removeItem('vlt_master_role');
    setCurrentUser(null);
  };

  const hasRole = (roleKey) => {
    // Admin has super-powers across all role checks
    return currentRole?.id === 'ADMIN' || currentRole?.id === roleKey;
  };

  const hasPermission = (permission) => {
    // Admin with 'all' or '*' has access to every feature, role management, and document verification
    if (currentRole?.permissions?.includes('all') || currentRole?.permissions?.includes('*')) {
      return true;
    }
    return currentRole?.permissions?.includes(permission);
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        currentUser,
        switchRole,
        loginAsDemo,
        logout,
        hasRole,
        hasPermission,
        allRoles: ROLES,
        demoProfiles: DEMO_PROFILES
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
