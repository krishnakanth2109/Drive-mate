import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Building2, Link as LinkIcon, Book, Camera } from 'lucide-react';
export function ProfilePage() {
  const navigate = useNavigate();

  let username = 'User';
  try {
    const token = sessionStorage.getItem('vlt_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      username = payload.sub || 'User';
    }
  } catch (e) {}

  return (
    <div className="max-w-[1280px] mx-auto p-6 lg:p-8 flex flex-col md:flex-row gap-8">
      {/* Profile Sidebar (Left) */}
      <div className="w-full md:w-[296px] shrink-0">
        <div className="relative mb-6 group">
          <div className="w-full aspect-square rounded-full border border-[#30363d] bg-[#161b22] flex items-center justify-center overflow-hidden relative">
            <span className="text-8xl text-[#8b949e] font-bold">{username.charAt(0).toUpperCase()}</span>
            {/* Edit overlay on hover */}
            <div 
              onClick={() => navigate('/settings')}
              className="absolute inset-x-0 bottom-0 h-1/3 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
            >
              <Camera className="w-5 h-5 text-white mb-1" />
              <span className="text-xs font-semibold text-white">Edit</span>
            </div>
          </div>
          <div className="absolute bottom-6 right-2 w-10 h-10 bg-[#0d1117] border border-[#30363d] rounded-full flex items-center justify-center shadow-sm hover:text-[#58a6ff] cursor-pointer">
            <span className="text-xl">🎯</span>
          </div>
        </div>

        <h1 className="mb-4">
          <span className="block text-2xl font-bold text-[#c9d1d9] leading-tight">{username}</span>
          <span className="block text-xl font-light text-[#8b949e] leading-tight">{username.toLowerCase()}</span>
        </h1>

        <button 
          onClick={() => navigate('/settings')}
          className="w-full bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-semibold px-4 py-1.5 rounded-md text-sm transition-colors mb-4"
        >
          Edit profile
        </button>

        <div className="flex items-center gap-1 text-sm text-[#c9d1d9] hover:text-[#58a6ff] cursor-pointer mb-6">
          <Users className="w-4 h-4 text-[#8b949e]" />
          <span className="font-semibold text-[#c9d1d9]">0</span> <span className="text-[#8b949e]">followers</span>
          <span className="text-[#c9d1d9] mx-1">·</span>
          <span className="font-semibold text-[#c9d1d9]">0</span> <span className="text-[#8b949e]">following</span>
        </div>

        <ul className="text-sm text-[#c9d1d9] flex flex-col gap-2">
          <li className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#8b949e]" />
            Vaultra Hub User
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#8b949e]" />
            Internet
          </li>
          <li className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#8b949e]" />
            <a href="#" className="hover:text-[#58a6ff] hover:underline">github.com/{username.toLowerCase()}</a>
          </li>
        </ul>
      </div>

      {/* Main Content (Right) */}
      <div className="flex-1 mt-4 md:mt-0">
        
        {/* Navigation Tabs */}
        <div className="border-b border-[#30363d] mb-6 flex gap-6">
          <button className="text-[#c9d1d9] font-semibold border-b-2 border-[#f78166] pb-2 flex items-center gap-2 text-sm">
            <Book className="w-4 h-4" /> Overview
          </button>
          <button className="text-[#8b949e] hover:text-[#c9d1d9] pb-2 flex items-center gap-2 text-sm transition-colors">
            <Book className="w-4 h-4" /> Repositories
            <span className="bg-[#30363d] text-[#c9d1d9] text-xs font-semibold px-2 py-0.5 rounded-full rounded-full">0</span>
          </button>
        </div>

        {/* Pinned Repos Placeholder */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm text-[#c9d1d9]">Pinned</h2>
          <button className="text-[#8b949e] hover:text-[#58a6ff] text-xs transition-colors font-medium">Customize your pins</button>
        </div>

        <div className="border border-dashed border-[#30363d] rounded-md p-8 text-center bg-[#0d1117] flex flex-col items-center">
          <Book className="w-8 h-8 text-[#8b949e] mb-4" />
          <h3 className="text-[#c9d1d9] font-semibold mb-2">You don't have any public repositories yet.</h3>
          <p className="text-sm text-[#8b949e] max-w-sm mx-auto mb-4">
            Once you create a public repository, you can pin it to your profile so other people can see it.
          </p>
        </div>
      </div>
    </div>
  );
}
