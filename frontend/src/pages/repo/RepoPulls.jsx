import React from 'react';
import { GitPullRequest } from 'lucide-react';

export function RepoPulls() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
      <div className="border border-[#30363d] rounded-md bg-[#0d1117] flex flex-col items-center justify-center py-20 text-center">
        <GitPullRequest className="w-10 h-10 text-[#8b949e] mb-4" />
        <h2 className="text-xl font-semibold text-[#c9d1d9] mb-2">Welcome to pull requests!</h2>
        <p className="text-[#8b949e] text-sm mb-4 max-w-md">
          Pull requests help you collaborate on code with other people. As pull requests are created, they'll appear here in a searchable and filterable list.
        </p>
        <button className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-sm px-4 py-2 rounded-md transition-colors border border-[rgba(240,246,252,0.1)]">
          New pull request
        </button>
      </div>
    </div>
  );
}
