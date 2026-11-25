import React from 'react';

const STATUS_MAP = {
  // Active / Positive
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',

  // Pending / In-progress
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'in progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ongoing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'pending review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  accepted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  arrived: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',

  // Warning / Escalated
  escalated: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'high priority': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse',

  // Negative / Cancelled
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
  inactive: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  offline: 'bg-neutral-800 text-neutral-400 border-neutral-700'
};

export function StatusPill({ status = 'pending', size = 'md', className = '' }) {
  const normStatus = String(status).toLowerCase().trim();
  const style = STATUS_MAP[normStatus] || 'bg-neutral-800 text-neutral-300 border-neutral-700';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1 font-semibold'
  }[size] || 'text-xs px-2.5 py-1';

  // Capitalize for display
  const label = normStatus
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${style} ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
