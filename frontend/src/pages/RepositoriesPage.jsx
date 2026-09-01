import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { Book, Search, Star } from 'lucide-react';

export function RepositoriesPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRepos() {
      try {
        const data = await fetchApi('/repos/');
        setRepos(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRepos();
  }, []);

  const filteredRepos = repos.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-[1280px] mx-auto p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#30363d] pb-6">
        <h1 className="text-2xl font-semibold text-[#c9d1d9]">Your Repositories</h1>
        <button className="bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors border border-[rgba(240,246,252,0.1)] flex items-center justify-center gap-2">
          <Book className="w-4 h-4" />
          New Repository
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#8b949e]" />
          </div>
          <input 
            type="text" 
            placeholder="Find a repository..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-sm rounded-md pl-9 pr-3 py-1.5 focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-[#0d1117] border-t border-[#30363d]">
          {filteredRepos.length > 0 ? (
            <ul className="divide-y divide-[#30363d]">
              {filteredRepos.map(repo => (
                <li key={repo.id} className="py-6 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <button 
                        onClick={() => navigate(`/${repo.ownerName}/${repo.name}`)}
                        className="text-xl font-semibold text-[#58a6ff] hover:underline"
                      >
                        {repo.name}
                      </button>
                      <span className="border border-[#30363d] text-[#8b949e] text-xs px-2 py-0.5 rounded-full font-medium">Public</span>
                    </div>
                    <p className="text-sm text-[#8b949e] mb-4">{repo.description || 'No description provided.'}</p>
                    <div className="flex items-center gap-4 text-xs text-[#8b949e]">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#f1e05a]"></div>
                        JavaScript
                      </div>
                      <div className="flex items-center gap-1 hover:text-[#58a6ff] cursor-pointer">
                        <Star className="w-3 h-3" /> 0
                      </div>
                      <div>Updated just now</div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex items-center gap-2">
                    <button className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] text-xs font-semibold px-3 py-1 rounded-md transition-colors flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3" /> Star
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16 text-[#8b949e]">
              <Book className="w-12 h-12 mx-auto mb-4 text-[#30363d]" />
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-2">No repositories found</h3>
              <p>You don't have any repositories that match.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
