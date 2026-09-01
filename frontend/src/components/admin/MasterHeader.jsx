import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Menu } from 'lucide-react';

export function MasterHeader({ toggleSidebar }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('vlt_master_token');
    navigate('/master');
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-[#1f1f2e] sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar}
          className="text-[#8a8a93] hover:text-white transition-colors md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Master Search Bar */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#5a5a63] group-focus-within:text-[#7a22ff] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search users, repositories, or logs globally..."
              className="block w-full pl-11 pr-4 py-2.5 border border-[#1f1f2e] rounded-2xl bg-[#15151e] text-white placeholder-[#5a5a63] focus:outline-none focus:border-[#7a22ff] focus:ring-1 focus:ring-[#7a22ff] text-sm transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* Right actions */}
      <div className="flex items-center gap-5">
        <button className="relative text-[#8a8a93] hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ff3366] rounded-full border-2 border-[#0a0a0f]"></span>
        </button>
        
        <div className="h-6 w-px bg-[#1f1f2e]"></div>

        {/* Master Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7a22ff] to-[#3a00b3] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(122,34,255,0.4)] border border-[#9d4edd]/30">
              A
            </div>
          </button>

          {profileOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              ></div>
              <div className="absolute right-0 mt-3 w-56 bg-[#15151e] border border-[#2a2a35] rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                <div className="px-5 py-3 border-b border-[#2a2a35] bg-[#0a0a0f]">
                  <p className="text-[10px] text-[#8a8a93] uppercase tracking-wider font-semibold">Master Session</p>
                  <p className="text-sm font-bold text-white truncate mt-0.5">Administrator</p>
                </div>
                
                <div className="py-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-2.5 text-sm text-[#ff3366] hover:bg-[#ff3366]/10 flex items-center gap-3 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" /> End Session
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
