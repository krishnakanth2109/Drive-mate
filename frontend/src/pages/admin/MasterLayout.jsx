import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  LogOut,
  ShieldCheck, 
  Menu, 
  X, 
  Radio, 
  KeyRound,
  FileCheck
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';

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
      path: '/master/dashboard', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      name: 'Orders & Rides', 
      path: '/master/orders', 
      icon: Car,
      badge: 'Live'
    },
    { 
      name: 'Riders & Fleet', 
      path: '/master/riders', 
      icon: Radio,
      badge: 'City KYC'
    },
    { 
      name: 'Users & Customers', 
      path: '/master/users', 
      icon: Users,
      badge: null
    },
    { 
      name: 'Roles & Permissions', 
      path: '/master/roles', 
      icon: ShieldCheck,
      badge: null
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-neutral-800/80">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-lg">DriveMate</h1>
            <p className="text-[11px] text-neutral-400">Master Operations Control</p>
          </div>
        </div>

        {/* Current Role Banner */}
        <div className="mt-4 p-2.5 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Access Level</p>
            <p className="text-xs font-bold text-emerald-400 truncate mt-0.5">
              {currentUser?.role || currentUser?.roles?.[0]?.name || 'Super Administrator'}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>
      </div>

      {/* Streamlined Nav Menu */}
      <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
          Management Console
        </p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/master/dashboard' && (location.pathname === '/master' || location.pathname.startsWith('/master/dashboard')));

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 group relative text-xs md:text-sm font-semibold
                ${isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 font-bold' 
                  : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'}
              `}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-400 font-normal">
                  {item.badge}
                </span>
              )}
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

      {/* Authenticated Admin Profile & Real Logout */}
      <div className="p-4 mt-auto border-t border-neutral-800 space-y-2 bg-neutral-950/40">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          <div className="truncate flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'Administrator'}</p>
            <p className="text-[10px] text-neutral-400 truncate">{currentUser?.email || 'admin@drivemate.com'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors border border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-neutral-950 text-white font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 h-full shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-neutral-900 lg:hidden"
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-neutral-300">Live PostgreSQL & OCR Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 hidden sm:inline-block">
              {currentUser?.email || 'admin@drivemate.com'}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
