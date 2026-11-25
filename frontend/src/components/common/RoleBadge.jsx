import React from 'react';

const ROLE_STYLES = {
  SUPPORT_AGENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  HEAD_OF_SUPPORT: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  SUPER_ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  FLEET_COACH: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  HEAD_OF_FLEET: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  MANAGER: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  OPERATIONS_MANAGER: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  FINANCE_ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  FINANCER: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  DEFAULT: 'bg-neutral-800 text-neutral-300 border-neutral-700'
};

export function RoleBadge({ role, size = 'md', showDot = true }) {
  const roleKey = typeof role === 'object' ? role?.id || role?.code : role;
  const style = ROLE_STYLES[roleKey] || ROLE_STYLES.DEFAULT;
  const label = typeof role === 'object' ? role?.name || role?.id : roleKey;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  }[size] || 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide ${style} ${sizeClasses}`}
    >
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse" />
      )}
      {label}
    </span>
  );
}
