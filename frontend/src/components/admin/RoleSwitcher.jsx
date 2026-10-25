import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import { RoleBadge } from '../common/RoleBadge';
import { ChevronDown, ShieldCheck, Check, Sparkles } from 'lucide-react';

export function RoleSwitcher() {
  const { currentRole, switchRole, allRoles } = useRole();
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

  const handleSelectRole = (roleKey) => {
    const newRole = switchRole(roleKey);
    setIsOpen(false);
    if (newRole?.defaultPath) {
      navigate(newRole.defaultPath);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80 transition-all text-xs"
      >
        <span className="text-neutral-400 font-medium hidden sm:inline">Role:</span>
        <RoleBadge role={currentRole} size="sm" />
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl divide-y divide-neutral-800/50">
          <div className="px-3 py-2 text-xs text-neutral-400 font-semibold flex items-center justify-between">
            <span>SWITCH PREVIEW ROLE</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="py-1 space-y-1 max-h-80 overflow-y-auto">
            {Object.values(allRoles).map(role => {
              const isSelected = currentRole?.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs ${
                    isSelected
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-white">{role.name}</span>
                    <span className="text-[10px] text-neutral-400 truncate max-w-[190px]">
                      {role.title}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 px-2 pb-1 text-[11px] text-neutral-500 text-center">
            Click any role to load its custom view & dashboard.
          </div>
        </div>
      )}
    </div>
  );
}
