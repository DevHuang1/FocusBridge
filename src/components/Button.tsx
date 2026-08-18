import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-sage-500 text-white hover:bg-sage-600 active:bg-sage-600 shadow-sm',
    secondary: 'bg-cream-200 text-text-primary hover:bg-cream-300 active:bg-cream-300',
    ghost: 'bg-transparent text-text-secondary hover:bg-cream-200 active:bg-cream-200',
    soft: 'bg-sage-50 text-sage-600 hover:bg-sage-100 active:bg-sage-100',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
