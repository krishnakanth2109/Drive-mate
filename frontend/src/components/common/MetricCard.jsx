import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const COLOR_THEMES = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'bg-emerald-500',
    trendBg: 'bg-emerald-500/10 text-emerald-400'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    glow: 'bg-cyan-500',
    trendBg: 'bg-cyan-500/10 text-cyan-400'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    glow: 'bg-purple-500',
    trendBg: 'bg-purple-500/10 text-purple-400'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    glow: 'bg-blue-500',
    trendBg: 'bg-blue-500/10 text-blue-400'
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    glow: 'bg-amber-500',
    trendBg: 'bg-amber-500/10 text-amber-400'
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    glow: 'bg-orange-500',
    trendBg: 'bg-orange-500/10 text-orange-400'
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    glow: 'bg-rose-500',
    trendBg: 'bg-rose-500/10 text-rose-400'
  },
  teal: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    text: 'text-teal-400',
    glow: 'bg-teal-500',
    trendBg: 'bg-teal-500/10 text-teal-400'
  }
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  progress, // number 0 - 100 optional
  delay = 0,
  onClick
}) {
  const theme = COLOR_THEMES[color] || COLOR_THEMES.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={onClick ? { y: -3, transition: { duration: 0.15 } } : {}}
      onClick={onClick}
      className={`p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 relative overflow-hidden group backdrop-blur-sm transition-all ${
        onClick ? 'cursor-pointer hover:border-neutral-700' : ''
      }`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1.5 truncate">
            {title}
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-neutral-400 mt-1 truncate">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`p-3 rounded-xl border ${theme.bg} ${theme.border} ${theme.text} flex-shrink-0 shadow-lg`}
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        )}
      </div>

      {/* Progress Bar (Optional) */}
      {typeof progress === 'number' && (
        <div className="mt-4 relative z-10">
          <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
            <span>Capacity</span>
            <span className="font-semibold text-white">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${theme.glow}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Trend indicator */}
      {trend && (
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs relative z-10">
          <div className="flex items-center gap-1 font-medium">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md ${
                trendType === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : trendType === 'down'
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {trendType === 'up' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
              {trendType === 'down' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {trendType === 'neutral' && <Minus className="w-3.5 h-3.5 mr-0.5" />}
              {trend}
            </span>
            <span className="text-neutral-500 text-[11px] ml-1">vs yesterday</span>
          </div>
        </div>
      )}

      {/* Ambient background glow */}
      <div
        className={`absolute -bottom-8 -right-8 w-28 h-28 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none rounded-full ${theme.glow}`}
      />
    </motion.div>
  );
}
