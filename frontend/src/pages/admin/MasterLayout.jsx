import React from 'react';
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
  X
} from 'lucide-react';

export function MasterLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    sessionStorage.removeItem('vlt_master_token');
    sessionStorage.removeItem('vlt_master_user');
    navigate('/master');
  };

  const navItems = [
    { name: 'Dashboard', path: '/master/dashboard', icon: LayoutDashboard },
    { name: 'Admins', path: '/master/admins', icon: ShieldCheck },
    { name: 'Users', path: '/master/users', icon: Users },
    { name: 'Rides & Vehicles', path: '/master/repos', icon: Car },
    { name: 'System Logs', path: '/master/logs', icon: ShieldAlert },
    { name: 'Settings', path: '/master/settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
      <div className="p-6 flex items-center space-x-3">
        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
          <ShieldAlert className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight">DriveMate</h1>
          <p className="text-xs text-neutral-400">Admin Control Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'}
              `}
            >
              <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-8 bg-emerald-500 rounded-r-full" 
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-neutral-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-500/70 group-hover:text-red-400" />
          <span className="font-medium">Logout Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 flex selection:bg-emerald-500/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-neutral-900 border-b border-neutral-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-white">Admin Panel</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-neutral-900 z-50 lg:hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4 z-50">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 flex flex-col pt-16 lg:pt-0">
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
