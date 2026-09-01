import React from 'react';
import { LineChart } from 'lucide-react';

export function RepoInsights() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-64 shrink-0">
        <ul className="flex flex-col gap-1">
          <li>
            <button className="w-full text-left bg-[#161b22] text-[#c9d1d9] font-semibold px-3 py-2 rounded-md border-l-4 border-l-[#f78166] text-sm">
              Pulse
            </button>
          </li>
          <li>
            <button className="w-full text-left text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] px-3 py-2 rounded-md border-l-4 border-l-transparent text-sm">
              Contributors
            </button>
          </li>
        </ul>
      </div>

      <div className="flex-1">
        <div className="border border-[#30363d] rounded-md bg-[#0d1117] p-6 text-center">
          <LineChart className="w-10 h-10 text-[#8b949e] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#c9d1d9] mb-2">Repository Insights</h2>
          <p className="text-[#8b949e] text-sm mb-4 max-w-md mx-auto">
            Get an overview of the activity in this repository.
          </p>
        </div>
      </div>
    </div>
  );
}
