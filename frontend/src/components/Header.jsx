import React from 'react';
import { Search, Bell, Plus, Menu } from 'lucide-react';
import { MyProfile } from './MyProfile';

export function Header({ toggleSidebar }) {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#010409] border-b border-[#30363d] sticky top-0 z-40">
      <div className="flex flex-1 items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#8b949e]" />
            </div>
            <input
              type="text"
              placeholder="Search or jump to..."
              className="block w-full pl-9 pr-3 py-1.5 border border-[#30363d] rounded-md leading-5 bg-[#0d1117] text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] sm:text-sm transition-colors"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-[#8b949e] text-xs border border-[#30363d] rounded px-1.5 py-0.5">/</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button className="text-[#8b949e] hover:text-[#c9d1d9] p-1 rounded-md transition-colors border border-transparent hover:border-[#30363d]">
          <Plus className="w-5 h-5" />
        </button>
        <button className="text-[#8b949e] hover:text-[#c9d1d9] p-1 rounded-md transition-colors border border-transparent hover:border-[#30363d] relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#3fb950] rounded-full border border-[#010409]"></span>
        </button>
        
        {/* Profile Dropdown */}
        <div className="pl-2 ml-2 border-l border-[#30363d]">
          <MyProfile />
        </div>
      </div>
    </header>
  );
}
