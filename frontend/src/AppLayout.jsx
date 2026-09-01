import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#0d1117]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
