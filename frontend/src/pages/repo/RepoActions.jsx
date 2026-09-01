import React from 'react';
import { PlayCircle } from 'lucide-react';

export function RepoActions() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
      <div className="border border-[#30363d] rounded-md bg-[#0d1117] flex flex-col items-center justify-center py-20 text-center">
        <PlayCircle className="w-10 h-10 text-[#8b949e] mb-4" />
        <h2 className="text-xl font-semibold text-[#c9d1d9] mb-2">Automate your workflow from idea to production</h2>
        <p className="text-[#8b949e] text-sm mb-4 max-w-md">
          Vaultra Actions makes it easy to automate all your software workflows, now with world-class CI/CD. Build, test, and deploy your code right from GitHub.
        </p>
        <button className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-semibold text-sm px-4 py-2 rounded-md transition-colors">
          Set up this repository
        </button>
      </div>
    </div>
  );
}
