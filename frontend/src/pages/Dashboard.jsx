import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { Book, Plus, Search, GitMerge, Star, GitCommit } from 'lucide-react';

export function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const loadRepos = async () => {
    try {
      const data = await fetchApi('/repos/');
      setRepos(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  const filteredRepos = repos.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row gap-8 p-6 lg:p-8">
      {/* Left Column: Top Repositories */}
      <aside className="w-full md:w-[320px] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Top Repositories</h2>
          <button 
            className="flex items-center gap-1 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold px-2 py-1 rounded-md transition-colors border border-[rgba(240,246,252,0.1)]"
            onClick={() => {/* Open Create Modal or Navigate */}}
          >
            <Book className="w-3.5 h-3.5" />
            New
          </button>
        </div>
        
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Find a repository..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-sm rounded-md pl-3 pr-3 py-1.5 focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filteredRepos.length > 0 ? (
              filteredRepos.map(repo => (
                <li key={repo.id}>
                  <button 
                    onClick={() => navigate(`/${repo.ownerName}/${repo.name}`)}
                    className="flex items-center gap-2 w-full text-left text-sm text-[#c9d1d9] hover:text-[#58a6ff] hover:underline"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#30363d] flex-shrink-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8b949e]"></div>
                    </div>
                    <span className="truncate">{repo.ownerName}/{repo.name}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="text-[#8b949e] text-sm text-center py-4 border border-dashed border-[#30363d] rounded-md">
                No repositories found.
              </li>
            )}
          </ul>
        )}
      </aside>

      {/* Main Column: Feed / Activity */}
      <main className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[#c9d1d9]">Home</h1>
          <div className="text-sm text-[#58a6ff] cursor-pointer hover:underline">Send feedback</div>
        </div>

        <div className="border border-[#30363d] rounded-md bg-[#0d1117] overflow-hidden mb-6">
          <div className="p-6 text-center border-b border-[#30363d]">
            <h2 className="text-lg font-semibold text-[#c9d1d9] mb-2">Discover interesting projects and people</h2>
            <p className="text-[#8b949e] text-sm mb-6 max-w-lg mx-auto">
              Vaultra Hub is home to developers and teams working on the next generation of software. Create a repository to start tracking your commits.
            </p>
            <button className="bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-sm font-semibold px-4 py-2 rounded-md transition-colors border border-[#30363d]">
              Explore Vaultra Hub
            </button>
          </div>
          
          {/* Mock Feed Items */}
          <div className="divide-y divide-[#30363d]">
            {[1, 2, 3].map(item => (
              <div key={item} className="p-4 flex gap-3 hover:bg-[#010409] transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#1f6feb] shrink-0 flex items-center justify-center text-white text-xs font-bold mt-1">
                  V
                </div>
                <div>
                  <div className="text-sm text-[#c9d1d9] mb-1">
                    <span className="font-semibold cursor-pointer hover:text-[#58a6ff] hover:underline">vaultra-team</span> pushed to <span className="font-semibold cursor-pointer hover:text-[#58a6ff] hover:underline">main</span> in <span className="font-semibold cursor-pointer hover:text-[#58a6ff] hover:underline">vaultra-team/core-engine</span>
                  </div>
                  <div className="text-xs text-[#8b949e] mb-2">3 hours ago</div>
                  <div className="bg-[#010409] border border-[#30363d] rounded-md p-3 text-sm">
                    <div className="flex items-center gap-2 text-[#c9d1d9] mb-1">
                      <GitCommit className="w-4 h-4 text-[#8b949e]" />
                      <span className="font-mono text-[#58a6ff] hover:underline cursor-pointer">a1b2c3d</span>
                      <span>Update parsing logic for AST trees</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
