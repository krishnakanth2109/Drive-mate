import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'neutral';
  onClick?: () => void;
}

const colorStyles = {
  emerald: {
    bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    glow: 'from-emerald-500/5 to-transparent',
  },
  blue: {
    bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    iconBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    glow: 'from-blue-500/5 to-transparent',
  },
  purple: {
    bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    glow: 'from-purple-500/5 to-transparent',
  },
  amber: {
    bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    glow: 'from-amber-500/5 to-transparent',
  },
  rose: {
    bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    glow: 'from-rose-500/5 to-transparent',
  },
  neutral: {
    bg: 'bg-neutral-800/40 border-neutral-800 text-neutral-300',
    iconBg: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
    glow: 'from-neutral-800/10 to-transparent',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald',
  onClick,
}) => {
  const scheme = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-5 transition-all duration-200 hover:border-neutral-700 backdrop-blur-sm ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      }`}
    >
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full bg-gradient-to-br ${scheme.glow} blur-2xl pointer-events-none`} />

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{title}</p>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive !== false ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.isPositive !== false ? '↑' : '↓'} {trend.value}
          </span>
          {trend.label && <span className="text-neutral-500">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
