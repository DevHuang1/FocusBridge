interface ProgressBarProps {
  progress: number;
  total: number;
  completed: number;
  className?: string;
}

export function ProgressBar({ progress, total, completed, className = '' }: ProgressBarProps) {
  return (
    <div className={className}>
      <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-600 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
            backgroundColor: 'var(--color-theme-primary)',
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-text-muted">{completed} of {total}</span>
        <span className="text-xs text-text-muted">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}
