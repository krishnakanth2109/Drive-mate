import React from 'react';
import { Star } from 'lucide-react';

export function StarredPage() {
  return (
    <div className="max-w-[1280px] mx-auto p-6 lg:p-8">
      <div className="border-b border-[#30363d] pb-6 mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#c9d1d9]">Stars</h1>
      </div>

      <div className="text-center py-20 border border-[#30363d] rounded-lg bg-[#0d1117]">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#161b22] border border-[#30363d] rounded-full flex items-center justify-center">
            <Star className="w-8 h-8 text-[#8b949e]" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-[#c9d1d9] mb-2">You don't have any starred repositories yet</h2>
        <p className="text-[#8b949e] mb-6 max-w-md mx-auto">
          As you explore Vaultra Hub, star repositories to save them for later and show your appreciation to the creators.
        </p>
        <button className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-semibold px-4 py-2 rounded-md transition-colors shadow-sm">
          Explore repositories
        </button>
      </div>
    </div>
  );
}
