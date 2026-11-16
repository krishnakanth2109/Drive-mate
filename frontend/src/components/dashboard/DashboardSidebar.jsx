import React from 'react';
import { 
  LayoutDashboard, 
  Bike, 
  PlusCircle, 
  User, 
  ShieldCheck, 
  MessageSquare, 
  LogOut, 
  Sparkles,
  MapPin,
  X,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Zap,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DashboardSidebar({ 
  activeTab, 
  setActiveTab, 
  userProfile, 
  onLogout,
  unreadCount = 0,
  isOpenMobile,
  setIsOpenMobile,
  theme = 'dark',
  setTheme,
  isSidebarCollapsed = false,
  setIsSidebarCollapsed
}) {
  const isDark = theme === 'dark';

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'rides', label: 'Bike Rides', icon: Bike, badge: 'Live' },
    { id: 'post-ride', label: 'Post a Bike Ride', icon: PlusCircle, badge: null },
    { id: 'user-details', label: 'User Details', icon: User, badge: null },
    { id: 'security', label: 'Security & Password', icon: ShieldCheck, badge: null },
    { id: 'inbox', label: 'Inbox & Chat', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
  ];

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('dm_theme', nextTheme);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen 
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} 
        w-72
        ${isDark 
          ? 'bg-[#090e1a]/95 border-r border-white/10 text-white' 
          : 'bg-white/95 border-r border-slate-200 text-slate-800 shadow-xl'} 
        backdrop-blur-2xl z-50 flex flex-col justify-between transition-all duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header */}
        <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#38c6ec] to-blue-600 flex items-center justify-center text-black font-extrabold shadow-[0_0_20px_rgba(56,198,236,0.3)] shrink-0">
                <Bike className="w-5 h-5 text-black" />
              </div>
              
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <span className={`text-base font-black tracking-tight flex items-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    DriveMate<span className="text-[#38c6ec]">.</span>
                  </span>
                  <span className={`text-[10px] font-semibold block truncate ${isDark ? 'text-[#38c6ec]' : 'text-sky-600'}`}>
                    Two-Wheeler BikePool
                  </span>
                </div>
              )}
            </div>

            {/* Collapse toggle (Desktop) & Close (Mobile) */}
            <div className="flex items-center gap-1">
              {!isSidebarCollapsed && setIsSidebarCollapsed && (
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className={`hidden lg:flex p-1.5 rounded-xl border transition-all cursor-pointer ${
                    isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}

              <button 
                onClick={() => setIsOpenMobile(false)}
                className={`lg:hidden p-2 rounded-xl ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* If Collapsed on Desktop: show expand button */}
          {isSidebarCollapsed && setIsSidebarCollapsed && (
            <div className="hidden lg:flex justify-center mt-3">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark ? 'bg-white/5 border-white/10 text-[#38c6ec] hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-sky-600 hover:bg-slate-200'
                }`}
                title="Expand Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Hub Badge & BikePool Mode (Only when expanded) */}
          {!isSidebarCollapsed && (
            <div className="space-y-2 mt-4">
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <MapPin className="w-3.5 h-3.5 text-[#38c6ec]" />
                  {userProfile?.city || 'Bangalore'} Hub
                </span>
                <span className="text-[10px] font-semibold text-[#0284c7] dark:text-[#38c6ec] bg-[#38c6ec]/15 px-2 py-0.5 rounded-full border border-[#38c6ec]/30">
                  Verified Biker
                </span>
              </div>

              {/* BikePool Banner */}
              <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-[11px] ${
                isDark ? 'bg-[#38c6ec]/10 border-[#38c6ec]/20 text-[#38c6ec]' : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}>
                <Zap className="w-3.5 h-3.5 shrink-0 text-[#38c6ec]" />
                <span className="font-semibold truncate">1 Pillion Spot • 100% Free Commute</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 p-3 space-y-1.5 overflow-y-auto ${isSidebarCollapsed ? 'lg:px-2' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`
                  w-full flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'justify-between'} px-3.5 py-3 rounded-2xl font-medium text-xs transition-all cursor-pointer group relative
                  ${isActive 
                    ? isDark
                      ? 'bg-[#38c6ec]/15 text-[#38c6ec] border border-[#38c6ec]/30 shadow-[0_0_15px_rgba(56,198,236,0.15)] font-bold'
                      : 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm font-bold'
                    : isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'}
                `}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'lg:gap-0' : ''}`}>
                  <Icon className={`w-4 h-4 transition-transform shrink-0 ${
                    isActive 
                      ? isDark ? 'text-[#38c6ec] scale-110' : 'text-sky-600 scale-110' 
                      : isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                  }`} />
                  
                  {/* Label (hidden if collapsed on desktop) */}
                  <span className={isSidebarCollapsed ? 'lg:hidden' : 'block'}>
                    {item.label}
                  </span>
                </div>

                {/* Badge & Active dot */}
                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isActive 
                          ? 'bg-[#38c6ec] text-black font-extrabold' 
                          : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div 
                        layoutId="activeIndicator"
                        className="w-1.5 h-1.5 rounded-full bg-[#38c6ec]"
                      />
                    )}
                  </div>
                )}

                {/* Collapsed active dot */}
                {isSidebarCollapsed && isActive && (
                  <span className="hidden lg:block absolute right-1.5 w-1.5 h-1.5 rounded-full bg-[#38c6ec]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: Theme Toggle, User Card & Sign Out */}
        <div className={`p-3 border-t space-y-2.5 ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50/80'}`}>
          {/* Theme Mode Switcher */}
          {!isSidebarCollapsed ? (
            <div 
              className="flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-xs cursor-pointer select-none"
              onClick={toggleTheme}
              style={{
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'
              }}
            >
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Moon className="w-3.5 h-3.5 text-[#38c6ec]" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className={`font-semibold text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {isDark ? 'Dark Theme' : 'Light Theme'}
                </span>
              </div>

              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${isDark ? 'bg-[#38c6ec]' : 'bg-slate-300'}`}>
                <motion.div 
                  animate={{ x: isDark ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center"
                >
                  {isDark ? <Moon className="w-2.5 h-2.5 text-slate-900" /> : <Sun className="w-2.5 h-2.5 text-amber-500" />}
                </motion.div>
              </div>
            </div>
          ) : (
            <button
              onClick={toggleTheme}
              className={`hidden lg:flex w-full items-center justify-center p-2 rounded-xl border cursor-pointer ${
                isDark ? 'bg-white/5 border-white/10 text-amber-400' : 'bg-white border-slate-200 text-slate-700'
              }`}
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* User Card */}
          {!isSidebarCollapsed ? (
            <div 
              onClick={() => setActiveTab('user-details')}
              className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-white/5 border-white/5 hover:border-white/15' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-bold text-black text-xs shrink-0">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {userProfile?.name || 'Commuter Member'}
                </div>
                <div className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {userProfile?.city || 'Bangalore'} Hub
                </div>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setActiveTab('user-details')}
              className="hidden lg:flex justify-center p-1 cursor-pointer"
              title="User Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-bold text-black text-xs">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'justify-center gap-2'} py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/20 font-semibold text-xs transition-all cursor-pointer`}
            title="Sign Out Session"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className={isSidebarCollapsed ? 'lg:hidden' : 'block'}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
export default DashboardSidebar;
