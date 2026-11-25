import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import { RoleBadge } from '../common/RoleBadge';
import { ChevronDown, ShieldCheck, Lock, Plus, FileCheck, Users, ArrowUpRight } from 'lucide-react';

export function RoleSwitcher() {
  const { currentRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80 transition-all text-xs"
      >
        <span className="text-neutral-400 font-medium hidden sm:inline">Active:</span>
        <RoleBadge role={currentRole} size="sm" />
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl divide-y divide-neutral-800/50">
          <div className="px-3 py-2 text-xs text-neutral-400 font-semibold flex items-center justify-between">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              MASTER ADMINISTRATOR
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Full Access</span>
          </div>

          <div className="py-2 space-y-1">
            <button
              onClick={() => handleNav('/master/access-control/roles')}
              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-neutral-800/70 text-xs text-neutral-300 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-white">Roles & Permissions Matrix</div>
                  <div className="text-[10px] text-neutral-500">Modify system roles & access</div>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400" />
            </button>

            <button
              onClick={() => handleNav('/master/access-control/roles/create')}
              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-neutral-800/70 text-xs text-neutral-300 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-white">Create New Role</div>
                  <div className="text-[10px] text-neutral-500">Configure custom permissions</div>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400" />
            </button>

            <button
              onClick={() => handleNav('/master/verification/dl')}
              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-neutral-800/70 text-xs text-neutral-300 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-semibold text-white">Driver Document Verification</div>
                  <div className="text-[10px] text-neutral-500">Inspect DL, Aadhaar, PAN & RC</div>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-400" />
            </button>

            <button
              onClick={() => handleNav('/master/admins')}
              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-neutral-800/70 text-xs text-neutral-300 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold text-white">Staff Management</div>
                  <div className="text-[10px] text-neutral-500">Assign roles to staff accounts</div>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-purple-400" />
            </button>
          </div>

          <div className="pt-2 px-2 pb-1 text-[10px] text-neutral-500 text-center">
            Authorized to modify all platform roles & verify driver documents.
          </div>
        </div>
      )}
    </div>
  );
}
