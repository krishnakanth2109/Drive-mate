import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  Car,
  Check,
  ShieldCheck,
  Radio
} from 'lucide-react';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
}) => {
  const norm = (status || '').toUpperCase().trim();

  let bg = 'bg-neutral-800 text-neutral-300 border-neutral-700';
  let Icon = HelpCircle;
  let text = label || status;

  switch (norm) {
    // Verification & Review Statuses
    case 'VERIFIED':
    case 'APPROVED':
      bg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      Icon = CheckCircle2;
      text = label || 'Verified';
      break;

    case 'PENDING':
    case 'PENDING_REVIEW':
      bg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      Icon = Clock;
      text = label || 'Pending Review';
      break;

    case 'MANUAL_REVIEW':
    case 'UNDER_REVIEW':
      bg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      Icon = AlertCircle;
      text = label || 'Manual Review';
      break;

    case 'IN_PROGRESS':
    case 'STARTED':
      bg = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      Icon = Radio;
      text = label || 'In Progress';
      break;

    case 'REJECTED':
    case 'FAILED':
      bg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      Icon = XCircle;
      text = label || (norm === 'FAILED' ? 'Failed' : 'Rejected');
      break;

    case 'EXPIRED':
      bg = 'bg-red-500/10 text-red-400 border-red-500/20';
      Icon = AlertTriangle;
      text = label || 'Expired';
      break;

    case 'NOT_SUBMITTED':
    case 'REQUIRED':
      bg = 'bg-neutral-800 text-neutral-400 border-neutral-700';
      Icon = Clock;
      text = label || 'Not Submitted';
      break;

    // Order / Trip Statuses
    case 'COMPLETED':
      bg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      Icon = CheckCircle2;
      text = label || 'Completed';
      break;

    case 'ACCEPTED':
    case 'ARRIVED':
      bg = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      Icon = Car;
      text = label || (norm === 'ARRIVED' ? 'Arrived' : 'Accepted');
      break;

    case 'CANCELLED':
      bg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      Icon = XCircle;
      text = label || 'Cancelled';
      break;

    // User / Driver Statuses
    case 'ACTIVE':
    case 'ONLINE':
      bg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      Icon = Check;
      text = label || (norm === 'ONLINE' ? 'Online' : 'Active');
      break;

    case 'OFFLINE':
    case 'INACTIVE':
      bg = 'bg-neutral-800 text-neutral-400 border-neutral-700';
      Icon = Clock;
      text = label || (norm === 'OFFLINE' ? 'Offline' : 'Inactive');
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border tracking-wide uppercase ${bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{text}</span>
    </span>
  );
};
