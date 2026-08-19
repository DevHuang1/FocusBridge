import React from 'react';
import { usePersonalizationStore } from '../store/usePersonalizationStore';

// ─── CSS-only animated list item (no Framer Motion) ─────────────
interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  as?: 'div' | 'section' | 'article';
}

export function AnimatedItem({ children, className = '', index = 0, as: Tag = 'div' }: AnimatedItemProps) {
  const intensity = usePersonalizationStore((s) => s.preferences.animationIntensity);

  if (intensity === 'still') {
    return <Tag className={className}>{children}</Tag>;
  }

  const delay = intensity === 'energizing' ? index * 80 : intensity === 'balanced' ? index * 50 : index * 30;

  return (
    <Tag
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </Tag>
  );
}
