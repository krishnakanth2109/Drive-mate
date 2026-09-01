import React, { useState } from 'react';
import { Settings, Users, GitBranch, Search, MoreVertical } from 'lucide-react';

export function RepoSettings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'collaborators', name: 'Collaborators', icon: Users },
    { id: 'branches', name: 'Branches', icon: GitBranch },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-3">Options</h3>
        <ul className="flex flex-col gap-1">
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#161b22] text-[#c9d1d9] font-semibold border-l-4 border-l-[#f78166]'
                    : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] border-l-4 border-l-transparent'
                }`}
              >
                {tab.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Settings Area */}
      <div className="flex-1">
        
        {activeTab === 'general' && (
          <div>
            <div className="border-b border-[#30363d] pb-4 mb-6">
              <h2 className="text-2xl font-semibold text-[#c9d1d9]">General Settings</h2>
            </div>
            
            <div className="flex flex-col gap-4 mb-8 max-w-2xl">
              <label className="text-sm font-semibold text-[#c9d1d9]">Repository name</label>
              <div className="flex gap-2">
                <input type="text" defaultValue="ssd" className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]" />
                <button className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-semibold px-4 py-1.5 rounded-md text-sm transition-colors">
                  Rename
                </button>
              </div>
            </div>
            
            <div className="border border-[#da3633] rounded-md overflow-hidden max-w-2xl mt-12">
              <div className="bg-[#0d1117] px-4 py-3 border-b border-[#30363d]">
                <h3 className="text-[#f85149] font-semibold text-sm">Danger Zone</h3>
              </div>
              <div className="p-4 bg-[#0d1117]">
                <div className="flex justify-between items-center py-4 border-b border-[#30363d]">
                  <div>
                    <h4 className="text-[#c9d1d9] text-sm font-semibold mb-1">Change repository visibility</h4>
                    <p className="text-xs text-[#8b949e]">This repository is currently public.</p>
                  </div>
                  <button className="bg-[#0d1117] hover:bg-[#da3633] border border-[#da3633] text-[#da3633] hover:text-white font-semibold px-4 py-1.5 rounded-md text-sm transition-colors">
                    Change visibility
                  </button>
                </div>
                <div className="flex justify-between items-center py-4">
                  <div>
                    <h4 className="text-[#c9d1d9] text-sm font-semibold mb-1">Delete this repository</h4>
                    <p className="text-xs text-[#8b949e]">Once you delete a repository, there is no going back. Please be certain.</p>
                  </div>
                  <button className="bg-[#0d1117] hover:bg-[#da3633] border border-[#da3633] text-[#da3633] hover:text-white font-semibold px-4 py-1.5 rounded-md text-sm transition-colors">
                    Delete this repository
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collaborators' && (
          <div>
            <div className="border-b border-[#30363d] pb-4 mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#c9d1d9]">Manage access</h2>
              <button className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold px-4 py-1.5 rounded-md text-sm border border-[rgba(240,246,252,0.1)]">
                Add people
              </button>
            </div>
            
            <div className="border border-[#30363d] rounded-md overflow-hidden bg-[#0d1117]">
              <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-[#8b949e]" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Find a collaborator..." 
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md pl-9 pr-3 py-1 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff]"
                  />
                </div>
              </div>

              {/* Mock Collaborator List */}
              <ul className="divide-y divide-[#30363d]">
                <li className="flex items-center justify-between p-4 hover:bg-[#161b22] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1f6feb] flex items-center justify-center text-white font-bold shrink-0">
                      U
                    </div>
                    <div>
                      <h4 className="text-[#c9d1d9] font-semibold text-sm">Vaultra User</h4>
                      <p className="text-[#8b949e] text-xs">user • Added just now</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="border border-[#30363d] rounded px-2 py-0.5 text-xs font-semibold text-[#8b949e]">Admin</span>
                    <button className="text-[#8b949e] hover:text-[#c9d1d9] p-1">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="text-center py-20 border border-[#30363d] rounded-md bg-[#0d1117] mt-8">
            <GitBranch className="w-10 h-10 text-[#8b949e] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#c9d1d9] mb-2">Branch protection rules</h2>
            <p className="text-[#8b949e] text-sm mb-4 max-w-md mx-auto">
              Branch protection rules define whether collaborators can delete or force push to the branch and set requirements for any pushes to the branch.
            </p>
            <button className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-semibold px-4 py-1.5 rounded-md text-sm transition-colors">
              Add branch protection rule
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}
