import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', padding = 'md', hover = false, onClick, style }: CardProps) {
  const paddings: Record<string, string> = {
    sm: 'p-5',
    md: 'p-7',
    lg: 'p-9',
  };

  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-surface rounded-[1.5rem] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-cream-200/50 ${paddings[padding]} ${hover ? 'cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-cream-200 transition-all duration-250' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
