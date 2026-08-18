import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  total: number;
  completed: number;
  className?: string;
}

export function ProgressBar({ progress, total, completed, className = '' }: ProgressBarProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2 bg-cream-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-sage-400 rounded-full"
        />
      </div>
      <span className="text-sm text-text-muted tabular-nums">
        {completed}/{total}
      </span>
    </div>
  );
}
