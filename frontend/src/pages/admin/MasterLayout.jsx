import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MasterSidebar } from '../../components/admin/MasterSidebar';
import { MasterHeader } from '../../components/admin/MasterHeader';

export function MasterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#05050a] text-white font-sans antialiased selection:bg-[#7a22ff]/30 selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar - Mobile responsive */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <MasterSidebar />
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle background glow for the master layout */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7a22ff] opacity-[0.03] blur-[100px] rounded-full pointer-events-none z-0"></div>
        
        <MasterHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto bg-[#05050a] relative z-10 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
