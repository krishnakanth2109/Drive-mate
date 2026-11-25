import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold shadow-lg shadow-emerald-500/20',
  secondary: 'bg-neutral-800 hover:bg-neutral-700 text-white font-medium border border-neutral-700',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold border border-red-500/30',
  accent: 'bg-brand hover:bg-brand-600 text-white font-bold shadow-lg shadow-brand/20',
  outline: 'bg-transparent hover:bg-neutral-800 text-neutral-300 font-medium border border-neutral-800 hover:border-neutral-700'
};

export function QuickActionBtn({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-xs md:text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-sm md:text-base px-5 py-2.5 rounded-xl gap-2.5 font-bold'
  }[size] || 'text-sm px-4 py-2 rounded-xl gap-2';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-150 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANTS[variant] || VARIANTS.primary} ${sizeClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
