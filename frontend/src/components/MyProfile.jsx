import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';

export function MyProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  let username = 'User';
  try {
    const token = sessionStorage.getItem('vlt_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      username = payload.sub || 'User';
    }
  } catch (e) {}

  const handleLogout = () => {
    sessionStorage.removeItem('vlt_token');
    navigate('/auth');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-[#1f6feb] flex items-center justify-center text-white font-bold text-sm cursor-pointer border border-[#30363d] hover:border-[#8b949e] transition-colors"
      >
        {username.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#161b22] border border-[#30363d] rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-[#30363d]">
            <p className="text-xs text-[#8b949e]">Signed in as</p>
            <p className="text-sm font-semibold text-[#c9d1d9] truncate">{username}</p>
          </div>
          
          <div className="py-1">
            <button 
              onClick={() => { navigate('/profile'); setIsOpen(false); }}
              className="w-full text-left px-4 py-1.5 text-sm text-[#c9d1d9] hover:bg-[#0366d6] hover:text-white flex items-center gap-2"
            >
              <User className="w-4 h-4" /> Your profile
            </button>
            <button 
              onClick={() => { navigate('/repositories'); setIsOpen(false); }}
              className="w-full text-left px-4 py-1.5 text-sm text-[#c9d1d9] hover:bg-[#0366d6] hover:text-white flex items-center gap-2"
            >
              Your repositories
            </button>
            <button 
              onClick={() => { navigate('/settings'); setIsOpen(false); }}
              className="w-full text-left px-4 py-1.5 text-sm text-[#c9d1d9] hover:bg-[#0366d6] hover:text-white flex items-center gap-2"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
          
          <div className="py-1 border-t border-[#30363d]">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-1.5 text-sm text-[#c9d1d9] hover:bg-[#0366d6] hover:text-white flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
