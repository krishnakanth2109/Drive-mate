import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-md border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#238636] hover:bg-[#2ea043] border-[rgba(240,246,252,0.1)] text-white',
    outline: 'bg-[#21262d] hover:bg-[#30363d] border-[#30363d] text-[#c9d1d9]',
    danger: 'bg-[#b62324] hover:bg-[#da3633] border-[rgba(240,246,252,0.1)] text-white',
  };

  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-5 py-2 text-sm',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
}
