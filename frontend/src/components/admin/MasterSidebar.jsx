import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Users, Database, Settings, ShieldAlert } from 'lucide-react';

export function MasterSidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/master/dashboard', icon: Activity },
    { name: 'All Users', path: '/master/users', icon: Users },
    { name: 'All Repositories', path: '/master/repos', icon: Database },
    { name: 'System Logs', path: '/master/logs', icon: ShieldAlert },
    { name: 'Settings', path: '/master/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0a0a0f] border-r border-[#1f1f2e] flex flex-col hidden md:flex sticky top-0 left-0 z-50">
      {/* Brand */}
      <div className="h-20 flex items-center px-6 border-b border-[#1f1f2e]">
        <div className="w-8 h-8 bg-gradient-to-br from-[#7a22ff] to-[#3a00b3] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(122,34,255,0.4)] mr-3">
          <ShieldAlert className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="block font-bold text-white text-lg tracking-tight leading-tight">Master</span>
          <span className="block text-[#a0a0a5] text-[10px] uppercase tracking-widest font-semibold">Console</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        <div className="text-xs font-bold text-[#5a5a63] uppercase tracking-wider mb-2 px-2">Administration</div>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-[#7a22ff]/20 to-transparent text-[#d4b3ff] border-l-2 border-[#7a22ff] shadow-[inset_20px_0_20px_-20px_rgba(122,34,255,0.3)]' 
                  : 'text-[#8a8a93] hover:bg-[#15151e] hover:text-[#d4b3ff] border-l-2 border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 mr-3 ${isActive ? 'text-[#7a22ff]' : 'text-[#8a8a93]'}`} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Mini Profile */}
      <div className="p-4 border-t border-[#1f1f2e]">
        <div className="flex items-center gap-3 bg-[#15151e] p-3 rounded-xl border border-[#2a2a35]">
          <div className="w-8 h-8 rounded-full bg-[#2a2a35] flex items-center justify-center text-white text-xs font-bold shrink-0">
            A
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">Administrator</p>
            <p className="text-[10px] text-[#8a8a93] uppercase tracking-wider font-semibold">Superuser</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
