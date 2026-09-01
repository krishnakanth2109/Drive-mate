import React from 'react';
import { Columns } from 'lucide-react';

export function RepoProjects() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
      <div className="border border-[#30363d] rounded-md bg-[#0d1117] flex flex-col items-center justify-center py-20 text-center">
        <Columns className="w-10 h-10 text-[#8b949e] mb-4" />
        <h2 className="text-xl font-semibold text-[#c9d1d9] mb-2">Welcome to projects!</h2>
        <p className="text-[#8b949e] text-sm mb-4 max-w-md">
          Projects are a customizable, flexible tool for planning and tracking your work.
        </p>
        <button className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-sm px-4 py-2 rounded-md transition-colors border border-[rgba(240,246,252,0.1)]">
          New project
        </button>
      </div>
    </div>
  );
}
