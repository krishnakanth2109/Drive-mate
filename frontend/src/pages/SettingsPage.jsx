import React, { useState } from 'react';
import { User, Bell, Shield, Key, Camera } from 'lucide-react';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Public profile', icon: User },
    { id: 'account', name: 'Account', icon: Shield },
    { id: 'security', name: 'Password and authentication', icon: Key },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-[1000px] mx-auto p-6 lg:p-8 flex flex-col md:flex-row gap-8">
      
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-3">Personal settings</h2>
        <nav className="flex flex-col gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-[#161b22] text-[#c9d1d9] font-semibold border-l-4 border-l-[#f78166]'
                  : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] border-l-4 border-l-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1">
        <div className="border-b border-[#30363d] pb-4 mb-6">
          <h1 className="text-2xl font-semibold text-[#c9d1d9]">
            {tabs.find(t => t.id === activeTab)?.name}
          </h1>
        </div>

        {activeTab === 'profile' && (
          <div className="max-w-2xl flex flex-col-reverse md:flex-row gap-8">
            <div className="flex-1">
              <div className="flex flex-col gap-4 mb-8">
                <label className="text-sm font-semibold text-[#c9d1d9]">Name</label>
                <input type="text" className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]" />
                <p className="text-xs text-[#8b949e]">Your name may appear around Vaultra Hub where you contribute or are mentioned. You can remove it at any time.</p>
              </div>

              <div className="flex flex-col gap-4 mb-8">
                <label className="text-sm font-semibold text-[#c9d1d9]">Bio</label>
                <textarea rows={4} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]" placeholder="Tell us a little bit about yourself"></textarea>
              </div>
              
              <button className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold px-4 py-2 rounded-md text-sm border border-[rgba(240,246,252,0.1)]">
                Update profile
              </button>
            </div>
            
            <div className="w-48 shrink-0">
              <label className="text-sm font-semibold text-[#c9d1d9] block mb-2">Profile picture</label>
              <div className="relative group rounded-full overflow-hidden w-48 h-48 border border-[#30363d] bg-[#161b22] flex items-center justify-center mb-4">
                <span className="text-6xl text-[#8b949e] font-bold">U</span>
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity border-t border-[#30363d]">
                  <Camera className="w-4 h-4 text-white mb-1" />
                  <span className="text-xs text-white">Edit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-xl">
            <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Change password</h3>
            <div className="bg-[#161b22] border border-[#30363d] rounded-md p-6">
              
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-[#c9d1d9]">Old password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]" />
              </div>
              
              <hr className="border-[#30363d] my-6" />

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-[#c9d1d9]">New password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]" />
                <p className="text-xs text-[#8b949e]">Make sure it's at least 15 characters OR at least 8 characters including a number and a lowercase letter.</p>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <label className="text-sm font-semibold text-[#c9d1d9]">Confirm new password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]" />
              </div>

              <button className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-semibold px-4 py-2 rounded-md text-sm transition-colors">
                Update password
              </button>
            </div>
          </div>
        )}

        {(activeTab === 'account' || activeTab === 'notifications') && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-md p-6 text-center">
            <Shield className="w-8 h-8 text-[#8b949e] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#c9d1d9] mb-2">Coming Soon</h3>
            <p className="text-[#8b949e] text-sm">This settings pane is currently under construction.</p>
          </div>
        )}
      </div>

    </div>
  );
}
