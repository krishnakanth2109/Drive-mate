import React, { useState } from 'react';
import { Users, Database, ShieldAlert, Activity, Search, MoreHorizontal, User, Server } from 'lucide-react';

export function MasterDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock Data
  const stats = [
    { label: 'Total Users', value: '1,248', icon: Users, color: 'text-blue-400' },
    { label: 'Total Repositories', value: '8,439', icon: Database, color: 'text-purple-400' },
    { label: 'Active Sessions', value: '142', icon: Activity, color: 'text-emerald-400' },
    { label: 'System Alerts', value: '3', icon: ShieldAlert, color: 'text-rose-400' },
  ];

  const users = [
    { id: 1, username: 'fdhs', email: 'fdhs@example.com', status: 'Active', role: 'User', created: '2023-10-15' },
    { id: 2, username: 'sarah_j', email: 'sarah@example.com', status: 'Active', role: 'User', created: '2023-11-02' },
    { id: 3, username: 'dev_ops22', email: 'dev@example.com', status: 'Suspended', role: 'User', created: '2024-01-20' },
    { id: 4, username: 'admin_sys', email: 'admin@vaultra.com', status: 'Active', role: 'Admin', created: '2023-01-01' },
  ];

  const repos = [
    { id: 1, name: 'ssd', owner: 'fdhs', size: '1.2 GB', visibility: 'Public', updated: 'Just now' },
    { id: 2, name: 'frontend-core', owner: 'sarah_j', size: '45 MB', visibility: 'Private', updated: '2 hours ago' },
    { id: 3, name: 'backend-api', owner: 'dev_ops22', size: '120 MB', visibility: 'Public', updated: '1 day ago' },
    { id: 4, name: 'vaultra-deploy', owner: 'admin_sys', size: '8 MB', visibility: 'Private', updated: '3 days ago' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Master Dashboard</h1>
        <p className="text-[#8a8a93] text-sm">System overview and administrative controls.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-[#0f0f16] border border-[#1f1f2e] rounded-2xl p-6 relative overflow-hidden group hover:border-[#3a3a4a] transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-[#7a22ff]/5 to-transparent rounded-full group-hover:from-[#7a22ff]/10 transition-colors pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className="text-[#8a8a93] text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              <div className={`p-2 rounded-lg bg-[#15151e] border border-[#2a2a35] ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white relative z-10">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-[#1f1f2e]">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'overview' ? 'text-[#d4b3ff] border-[#7a22ff]' : 'text-[#8a8a93] border-transparent hover:text-white'}`}
        >
          System Overview
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'users' ? 'text-[#d4b3ff] border-[#7a22ff]' : 'text-[#8a8a93] border-transparent hover:text-white'}`}
        >
          All Users
        </button>
        <button 
          onClick={() => setActiveTab('repos')}
          className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'repos' ? 'text-[#d4b3ff] border-[#7a22ff]' : 'text-[#8a8a93] border-transparent hover:text-white'}`}
        >
          All Repositories
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0f0f16] border border-[#1f1f2e] rounded-2xl p-6">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#7a22ff]" />
              System Load
            </h3>
            <div className="h-48 flex items-end justify-between gap-2 border-b border-l border-[#1f1f2e] p-4">
              {[40, 70, 45, 90, 65, 80, 50, 75, 60, 40].map((h, i) => (
                <div key={i} className="w-full bg-gradient-to-t from-[#7a22ff] to-[#3a00b3] rounded-t-sm opacity-50 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#0f0f16] border border-[#1f1f2e] rounded-2xl p-6">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#ff3366]" />
              Recent Alerts
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4 p-3 bg-[#15151e] border border-[#2a2a35] rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#ff3366] mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-white">High CPU Usage</p>
                  <p className="text-xs text-[#8a8a93]">Server 'vault-node-1' is experiencing 95% CPU load.</p>
                </div>
                <span className="text-[10px] text-[#5a5a63] ml-auto">2m ago</span>
              </div>
              <div className="flex items-start gap-4 p-3 bg-[#15151e] border border-[#2a2a35] rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#ffb340] mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-white">Failed Auth Attempts</p>
                  <p className="text-xs text-[#8a8a93]">Multiple failed login attempts detected from IP 192.168.x.x.</p>
                </div>
                <span className="text-[10px] text-[#5a5a63] ml-auto">1h ago</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-[#0f0f16] border border-[#1f1f2e] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-[#1f1f2e] flex items-center justify-between bg-[#0a0a0f]">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-[#5a5a63] absolute left-3 top-2.5" />
              <input type="text" placeholder="Search users by ID or email..." className="w-full bg-[#15151e] border border-[#2a2a35] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#7a22ff]" />
            </div>
            <button className="bg-[#15151e] hover:bg-[#2a2a35] border border-[#2a2a35] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0a0a0f] text-[#8a8a93] font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f2e]">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-[#15151e]/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2a2a35] flex items-center justify-center text-[#d4b3ff] font-bold"><User className="w-4 h-4"/></div>
                      <div>
                        <p className="font-semibold text-white">{user.username}</p>
                        <p className="text-xs text-[#5a5a63]">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${user.status === 'Active' ? 'bg-[#3fb950]/10 border-[#3fb950]/30 text-[#3fb950]' : 'bg-[#ff3366]/10 border-[#ff3366]/30 text-[#ff3366]'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#a0a0a5]">{user.role}</td>
                    <td className="px-6 py-4 text-[#5a5a63]">{user.created}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#8a8a93] hover:text-white p-2 rounded-lg hover:bg-[#2a2a35] transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'repos' && (
        <div className="bg-[#0f0f16] border border-[#1f1f2e] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-[#1f1f2e] flex items-center justify-between bg-[#0a0a0f]">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-[#5a5a63] absolute left-3 top-2.5" />
              <input type="text" placeholder="Search repositories..." className="w-full bg-[#15151e] border border-[#2a2a35] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#7a22ff]" />
            </div>
            <button className="bg-[#15151e] hover:bg-[#2a2a35] border border-[#2a2a35] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Filter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0a0a0f] text-[#8a8a93] font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Repository</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Visibility</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f2e]">
                {repos.map(repo => (
                  <tr key={repo.id} className="hover:bg-[#15151e]/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2a2a35] flex items-center justify-center text-[#7a22ff] font-bold"><Server className="w-4 h-4"/></div>
                      <p className="font-semibold text-white">{repo.name}</p>
                    </td>
                    <td className="px-6 py-4 text-[#a0a0a5] hover:text-[#d4b3ff] cursor-pointer">{repo.owner}</td>
                    <td className="px-6 py-4 text-[#a0a0a5]">{repo.size}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${repo.visibility === 'Public' ? 'bg-[#58a6ff]/10 border-[#58a6ff]/30 text-[#58a6ff]' : 'bg-[#e3b341]/10 border-[#e3b341]/30 text-[#e3b341]'}`}>
                        {repo.visibility}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#5a5a63]">{repo.updated}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#8a8a93] hover:text-white p-2 rounded-lg hover:bg-[#2a2a35] transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
