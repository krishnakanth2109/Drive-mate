import React, { useState } from 'react';
import { 
  Bike, 
  Search, 
  Home, 
  PlusCircle, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Radio, 
  ChevronDown, 
  LogOut, 
  MapPin, 
  Shield, 
  Zap,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DashboardHeader({
  activeTab,
  setActiveTab,
  userProfile,
  theme = 'dark',
  setTheme,
  unreadCount = 0,
  onLogout,
  searchQuery = '',
  setSearchQuery
}) {
  const isDark = theme === 'dark';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('dm_theme', nextTheme);
  };

  const navItems = [
    { id: 'overview', label: 'Home Feed', icon: Home, badge: null },
    { id: 'rides', label: 'Bike Rides', icon: Bike, badge: 'Live' },
    { id: 'post-ride', label: 'Post a Ride', icon: PlusCircle, badge: null },
    { id: 'inbox', label: 'Messaging', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'security', label: 'Security', icon: ShieldCheck, badge: null },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-colors duration-200 ${
      isDark 
        ? 'bg-[#0b1120]/95 border-white/10 text-white' 
        : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & LinkedIn-style Search Bar */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-md">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 cursor-pointer shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#38c6ec] to-blue-600 flex items-center justify-center font-black text-black shadow-[0_0_15px_rgba(56,198,236,0.3)] transition-transform group-hover:scale-105">
              <Bike className="w-5 h-5 text-black" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-base tracking-tight flex items-center">
                DriveMate<span className="text-[#38c6ec]">.</span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-md bg-[#38c6ec]/15 text-[#0284c7] dark:text-[#38c6ec] font-bold border border-[#38c6ec]/30">
                  BikePool
                </span>
              </span>
            </div>
          </div>

          {/* Search Box (LinkedIn Style) */}
          <div className="relative w-full max-w-xs hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Search bike rides, tech parks, routes..."
              className={`w-full rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none transition-all ${
                isDark 
                  ? 'bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec] focus:ring-1 focus:ring-[#38c6ec]/30' 
                  : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* Center: LinkedIn Style Navigation Bar (Stacked Icon + Label with Active Underline) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  relative flex flex-col items-center justify-center min-w-[64px] lg:min-w-[72px] h-14 px-2 transition-all cursor-pointer select-none group
                  ${isActive 
                    ? isDark ? 'text-[#38c6ec]' : 'text-sky-600'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}
                `}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'scale-105' : ''}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                
                <span className={`text-[10px] mt-1 font-semibold ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>

                {/* LinkedIn Active Underline Bar */}
                {isActive && (
                  <motion.div
                    layoutId="linkedinNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38c6ec]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Live Bikers Badge, Theme Toggle & "Me" Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Bikers Online Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-semibold">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>180+ Bikers Online</span>
          </div>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isDark 
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-400' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title={`Switch to ${isDark ? 'White' : 'Dark'} Theme`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* LinkedIn "Me" Profile Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className={`flex flex-col items-center justify-center h-14 px-2 rounded-xl transition-all cursor-pointer ${
                showProfileMenu || activeTab === 'user-details' 
                  ? isDark ? 'text-[#38c6ec]' : 'text-sky-600'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-extrabold text-black text-[10px] shadow-sm">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className="text-[10px] font-semibold">Me</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 top-14 w-64 rounded-2xl border shadow-2xl p-3 z-50 ${
                    isDark 
                      ? 'bg-[#0f172a] border-white/10 text-white' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {/* User Info Header */}
                  <div className="flex items-center gap-3 p-2 rounded-xl border mb-2 bg-black/20 border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-extrabold text-black text-sm shrink-0">
                      {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {userProfile?.name || 'Commuter Member'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {userProfile?.profession || 'Verified Biker'}
                      </div>
                      <div className="text-[10px] text-[#38c6ec] font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {userProfile?.city || 'Bangalore'} Hub
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setActiveTab('user-details');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-all ${
                        isDark ? 'hover:bg-white/5 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <User className="w-4 h-4 text-[#38c6ec]" />
                      <span>View & Edit Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('security');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-all ${
                        isDark ? 'hover:bg-white/5 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Security & Password</span>
                    </button>

                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 mt-1">
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 font-semibold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setShowMobileNav((prev) => !prev)}
            className={`md:hidden p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            {showMobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`md:hidden border-t px-4 py-3 space-y-1 ${
              isDark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowMobileNav(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold ${
                    isActive 
                      ? 'bg-[#38c6ec]/15 text-[#38c6ec] font-bold' 
                      : isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
export default DashboardHeader;
