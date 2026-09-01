import React from 'react';

export function Card({ children, className = '', hoverEffect = false, ...props }) {
  return (
    <div
      className={`bg-[#161b22] border border-[#30363d] rounded-md ${hoverEffect ? 'hover:border-[#58a6ff] cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`px-4 py-3 border-b border-[#30363d] flex items-center gap-2 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`px-4 py-3 border-t border-[#30363d] ${className}`}>{children}</div>;
}
