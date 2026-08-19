import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2.5 rounded-[1.25rem] font-medium cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-200';

  const variants: Record<string, string> = {
    primary: 'text-white shadow-sm hover:brightness-110 active:scale-[0.98]',
    secondary: 'text-text-primary hover:brightness-95 active:scale-[0.98]',
    ghost: 'bg-transparent text-text-secondary hover:bg-cream-200 active:bg-cream-300',
    soft: 'text-sage-600 hover:brightness-95 active:scale-[0.98]',
  };

  const sizes: Record<string, string> = {
    sm: 'px-5 py-2.5 text-sm min-h-[40px]',
    md: 'px-7 py-3.5 text-base min-h-[48px]',
    lg: 'px-9 py-4.5 text-lg min-h-[56px]',
  };

  const styles: React.CSSProperties =
    variant === 'primary'
      ? { backgroundColor: 'var(--color-theme-primary)', outlineColor: 'var(--color-theme-primary)' }
      : variant === 'secondary'
      ? { backgroundColor: 'var(--color-theme-surface)', outlineColor: 'var(--color-theme-primary)' }
      : variant === 'soft'
      ? { backgroundColor: 'var(--color-theme-primary-light)', outlineColor: 'var(--color-theme-primary)' }
      : { outlineColor: 'var(--color-theme-primary)' };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={styles}
      {...props}
    >
      {children}
    </button>
  );
}
