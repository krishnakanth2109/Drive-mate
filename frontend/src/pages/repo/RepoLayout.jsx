import React from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { Code, CircleDot, GitPullRequest, PlayCircle, Columns, Shield, Settings, LineChart } from 'lucide-react';

export function RepoLayout() {
  const { owner, repo } = useParams();
  const location = useLocation();
  
  // Helper to check if a tab is active
  const isActive = (path) => {
    if (path === '') {
      return location.pathname === `/${owner}/${repo}` || location.pathname.startsWith(`/${owner}/${repo}/commits`) || location.pathname.startsWith(`/${owner}/${repo}/commit`);
    }
    return location.pathname.startsWith(`/${owner}/${repo}/${path}`);
  };

  const tabs = [
    { name: 'Code', path: '', icon: Code },
    { name: 'Issues', path: 'issues', icon: CircleDot, count: '0' },
    { name: 'Pull requests', path: 'pulls', icon: GitPullRequest, count: '0' },
    { name: 'Actions', path: 'actions', icon: PlayCircle },
    { name: 'Projects', path: 'projects', icon: Columns, count: '0' },
    { name: 'Security', path: 'security', icon: Shield },
    { name: 'Insights', path: 'insights', icon: LineChart },
    { name: 'Settings', path: 'settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Repo Header & Navigation */}
      <div className="bg-[#0d1117] pt-4 border-b border-[#30363d] px-4 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link to="/dashboard" className="text-[#58a6ff] hover:underline text-xl font-semibold">{owner}</Link>
          <span className="text-[#8b949e] text-xl">/</span>
          <Link to={`/${owner}/${repo}`} className="text-[#c9d1d9] text-xl font-semibold hover:underline">{repo}</Link>
          <span className="ml-2 border border-[#30363d] text-[#8b949e] text-xs px-2 py-0.5 rounded-full font-medium">Public</span>
        </div>

        {/* Tabs */}
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map(tab => (
            <Link
              key={tab.name}
              to={`/${owner}/${repo}${tab.path ? `/${tab.path}` : ''}`}
              className={`flex items-center gap-2 pb-2 text-sm transition-colors border-b-2 whitespace-nowrap px-2 ${
                isActive(tab.path)
                  ? 'text-[#c9d1d9] font-semibold border-[#f78166]'
                  : 'text-[#8b949e] border-transparent hover:text-[#c9d1d9]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
              {tab.count !== undefined && (
                <span className="bg-[#30363d] text-[#c9d1d9] text-xs font-semibold px-2 py-0.5 rounded-full ml-1">{tab.count}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
