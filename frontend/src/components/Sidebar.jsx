import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Book, Settings, Users, Star, ChevronLeft, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Repositories', path: '/repositories', icon: Book },
    { name: 'Organizations', path: '/organizations', icon: Users },
    { name: 'Starred', path: '/starred', icon: Star },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-[#010409] border-r border-[#30363d] flex flex-col hidden md:flex sticky top-0 left-0 transition-all duration-300 z-50`}>
      {/* Brand */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-[#30363d]">
        <svg viewBox="0 0 256 256" className="w-6 h-6 shrink-0 text-[#c9d1d9] fill-current">
          <path d="M 128 128 C 128 198.692 70.692 256 0 256 C 0 185.308 57.308 128 128 128 Z M 128 128 C 198.692 128 256 185.308 256 256 C 185.308 256 128 198.692 128 128 Z M 0 0 C 70.692 0 128 57.308 128 128 C 57.308 128 0 70.692 0 0 Z M 256 0 C 256 70.692 198.692 128 128 128 C 128 57.308 185.308 0 256 0 Z" />
        </svg>
        {!isCollapsed && <span className="ml-3 font-bold text-[#c9d1d9] text-lg tracking-tight whitespace-nowrap overflow-hidden">Vaultra</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1 overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 rounded-md transition-colors ${
                isActive 
                  ? 'bg-[#161b22] text-[#c9d1d9] font-semibold' 
                  : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#c9d1d9]' : 'text-[#8b949e]'}`} />
              {!isCollapsed && <span className="ml-3 text-sm whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-[#30363d] flex justify-end">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22] rounded-md transition-colors w-full flex justify-center"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
