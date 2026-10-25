import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Settings, 
  LogOut,
  ShieldAlert, 
  ShieldCheck, 
  Menu, 
  X, 
  Lock,
  Headphones,
  CreditCard,
  Radio,
  FileText
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { RoleBadge } from '../../components/common/RoleBadge';
import { RoleSwitcher } from '../../components/admin/RoleSwitcher';

export function MasterLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentRole, currentUser, logout } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/master');
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      path: currentRole?.defaultPath || '/master/dashboard/admin', 
      icon: LayoutDashboard,
      highlight: true
    },
    { 
      name: 'Live Rides & GPS', 
      path: '/master/rides', 
      icon: Car 
    },
    { 
      name: 'Drivers & Fleet', 
      path: '/master/drivers', 
      icon: Radio 
    },
    { 
      name: 'Support & Claims', 
      path: '/master/tickets', 
      icon: Headphones 
    },
    { 
      name: 'Finance & Payouts', 
      path: '/master/finance', 
      icon: CreditCard 
    },
    { 
      name: 'Passenger Users', 
      path: '/master/users', 
      icon: Users 
    },
    { 
      name: 'Security Audit Logs', 
      path: '/master/logs', 
      icon: ShieldAlert 
    },
    { 
      name: 'RBAC Roles Matrix', 
      path: '/master/access-control/roles', 
      icon: Lock 
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
      {/* Brand logo & active role banner */}
      <div className="p-6 border-b border-neutral-800/80">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-lg">DriveMate</h1>
            <p className="text-[11px] text-neutral-400">Operations Control Center</p>
          </div>
        </div>

        {/* Current Active Role Pill */}
        <div className="mt-3 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800/80 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Active Role</p>
            <p className="text-xs font-bold text-white truncate mt-0.5">{currentRole?.name}</p>
          </div>
          <RoleBadge role={currentRole} size="sm" showDot={false} />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.name === 'Dashboard' && location.pathname.startsWith('/master/dashboard'));

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                flex items-center px-4 py-2.5 rounded-xl transition-all duration-150 group relative text-xs md:text-sm font-medium
                ${isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 font-bold' 
                  : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'}
              `}
            >
              <item.icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
              <span className="truncate">{item.name}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full" 
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & logout */}
      <div className="p-4 mt-auto border-t border-neutral-800 space-y-2">
        {currentUser && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-neutral-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                {currentUser.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="truncate flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-neutral-400 truncate">{currentUser.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs font-medium border border-transparent hover:border-red-500/20 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2 text-red-500" />
          <span>Exit Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 flex selection:bg-emerald-500/30 text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 flex-shrink-0 z-30">
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-neutral-900/90 border-b border-neutral-800 sticky top-0 z-20 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-neutral-400">Environment:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                Neon PostgreSQL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Role Switcher */}
            <RoleSwitcher />
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                className="fixed inset-y-0 left-0 w-72 bg-neutral-900 z-50 lg:hidden shadow-2xl"
              >
                <div className="absolute top-4 right-4 z-50">
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Content Outlet */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
