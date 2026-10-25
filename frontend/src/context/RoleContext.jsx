import React, { createContext, useContext, useState, useEffect } from 'react';

export const ROLES = {
  SUPPORT_AGENT: {
    id: 'SUPPORT_AGENT',
    name: 'Support Agent',
    title: 'Customer & Driver Support',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Resolves passenger disputes, ride issues, SOS alerts, and driver tickets.',
    defaultPath: '/master/dashboard/support',
    permissions: ['tickets:read', 'tickets:write', 'rides:read', 'chat:manage']
  },
  HEAD_OF_SUPPORT: {
    id: 'HEAD_OF_SUPPORT',
    name: 'Head of Support',
    title: 'Support Operations Director',
    color: 'cyan',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    description: 'Oversees support queues, escalations, CSAT metrics, and high-value dispute refunds.',
    defaultPath: '/master/dashboard/head-support',
    permissions: ['tickets:read', 'tickets:write', 'tickets:escalate', 'refunds:approve', 'analytics:support']
  },
  ADMIN: {
    id: 'ADMIN',
    name: 'Administrator',
    title: 'System Administrator',
    color: 'purple',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description: 'Full platform administration, RBAC access control, staff management, and system audits.',
    defaultPath: '/master/dashboard/admin',
    permissions: ['all']
  },
  FLEET_COACH: {
    id: 'FLEET_COACH',
    name: 'Fleet Coach',
    title: 'Driver Onboarding & Vehicle Inspector',
    color: 'amber',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'Driver document verification, vehicle quality checks, training modules, and driver ratings.',
    defaultPath: '/master/dashboard/fleet-coach',
    permissions: ['drivers:read', 'drivers:verify', 'vehicles:inspect', 'training:manage']
  },
  HEAD_OF_FLEET: {
    id: 'HEAD_OF_FLEET',
    name: 'Head of Fleet Coach',
    title: 'Fleet Operations Director',
    color: 'orange',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    description: 'Manages regional fleet capacity, coach assignments, compliance ratios, and driver retention.',
    defaultPath: '/master/dashboard/head-fleet',
    permissions: ['drivers:read', 'drivers:manage', 'fleet:analytics', 'coaches:assign']
  },
  MANAGER: {
    id: 'MANAGER',
    name: 'Operations Manager',
    title: 'City & Regional Operations Manager',
    color: 'blue',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'City supply/demand analytics, surge pricing rules, trip completion rates, and KPI oversight.',
    defaultPath: '/master/dashboard/manager',
    permissions: ['rides:read', 'surge:manage', 'analytics:operations', 'reports:export']
  },
  FINANCE_ADMIN: {
    id: 'FINANCE_ADMIN',
    name: 'Finance Admin',
    title: 'Chief Financial Controller',
    color: 'rose',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    description: 'GMV reporting, gateway settlement audits, commission structures, and bulk payout authorizations.',
    defaultPath: '/master/dashboard/finance-admin',
    permissions: ['finance:read', 'finance:manage', 'payouts:authorize', 'tax:audit']
  },
  FINANCER: {
    id: 'FINANCER',
    name: 'Financer',
    title: 'Disbursements & Payout Executive',
    color: 'teal',
    badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    description: 'Processes daily driver bank payouts, wallet adjustments, wire verification, and refund vouchers.',
    defaultPath: '/master/dashboard/financer',
    permissions: ['payouts:process', 'wallets:adjust', 'transactions:read']
  }
};

// Preset demo accounts for each role
export const DEMO_PROFILES = [
  {
    roleId: 'SUPPORT_AGENT',
    name: 'Priya Sharma',
    email: 'support.agent@drivemate.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    department: 'Customer Delight',
    badge: 'Tier-1 Support'
  },
  {
    roleId: 'HEAD_OF_SUPPORT',
    name: 'Rajesh Kulkarni',
    email: 'head.support@drivemate.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    department: 'Support Leadership',
    badge: 'Director'
  },
  {
    roleId: 'ADMIN',
    name: 'Krishna Kanth',
    email: 'admin@drivemate.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    department: 'Core Infrastructure',
    badge: 'Super Admin'
  },
  {
    roleId: 'FLEET_COACH',
    name: 'Vikram Singh',
    email: 'coach.vikram@drivemate.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    department: 'Driver Academy',
    badge: 'Senior Inspector'
  },
  {
    roleId: 'HEAD_OF_FLEET',
    name: 'Anita Verma',
    email: 'head.fleet@drivemate.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
    department: 'Fleet Operations',
    badge: 'Fleet Chief'
  },
  {
    roleId: 'MANAGER',
    name: 'Arjun Nair',
    email: 'manager.arjun@drivemate.com',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
    department: 'City Operations - Bangalore',
    badge: 'City Head'
  },
  {
    roleId: 'FINANCE_ADMIN',
    name: 'Sunita Mehra',
    email: 'finance.admin@drivemate.com',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
    department: 'Treasury & Revenue',
    badge: 'Financial Controller'
  },
  {
    roleId: 'FINANCER',
    name: 'Karan Patel',
    email: 'financer.karan@drivemate.com',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face',
    department: 'Accounts Payable',
    badge: 'Disbursement Exec'
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
    // Default to Admin demo user if logged in
    return DEMO_PROFILES[2];
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
    );

    if (targetRole) {
      setCurrentRole(targetRole);
      const matchedProfile = DEMO_PROFILES.find(p => p.roleId === targetRole.id) || {
        roleId: targetRole.id,
        name: `${targetRole.name} User`,
        email: `${targetRole.id.toLowerCase()}@drivemate.com`,
        department: targetRole.title,
        badge: 'Staff'
      };
      setCurrentUser(matchedProfile);
      return targetRole;
    }
    return currentRole;
  };

  const loginAsDemo = (profile) => {
    const role = ROLES[profile.roleId] || ROLES.ADMIN;
    setCurrentRole(role);
    setCurrentUser(profile);
    sessionStorage.setItem('vlt_master_token', `demo_token_${profile.roleId.toLowerCase()}_${Date.now()}`);
    sessionStorage.setItem('vlt_master_user', JSON.stringify(profile));
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
    return currentRole?.id === roleKey || currentRole?.id === 'ADMIN';
  };

  const hasPermission = (permission) => {
    if (currentRole?.permissions?.includes('all')) return true;
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
