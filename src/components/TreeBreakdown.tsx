import type { TaskStep } from '../types';
import { Clock } from 'lucide-react';

interface TreeBreakdownProps {
  goalTitle: string;
  steps: TaskStep[];
}

export function TreeBreakdown({ goalTitle, steps }: TreeBreakdownProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative animate-scale-in">
        <div className="bg-sage-500 text-white px-5 py-3 rounded-2xl max-w-xs text-center shadow-sm">
          <p className="font-serif text-sm md:text-base leading-snug">{goalTitle}</p>
        </div>
      </div>

      <div className="flex flex-col items-center mt-1">
        {steps.map((step, i) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isStuck = step.status === 'stuck';
          const isSkipped = step.status === 'skipped';

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className="w-0.5 h-9 bg-sage-200 animate-grow-down" style={{ animationDelay: `${i * 250 + 300}ms` }} />

              <div className="relative animate-fade-in" style={{ animationDelay: `${i * 250 + 450}ms` }}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                  isCompleted ? 'bg-sage-50 border-sage-200 opacity-60' :
                  isActive ? 'bg-cream-50 border-sage-300 shadow-sm' :
                  isStuck ? 'bg-cream-50 border-cream-300 border-dashed opacity-50' :
                  isSkipped ? 'bg-cream-50 border-cream-200 opacity-30' :
                  'bg-cream-50 border-cream-200'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                    isCompleted ? 'bg-sage-200 text-sage-600' : isActive ? 'bg-sage-400 text-white' : 'bg-cream-200 text-text-muted'
                  }`}>
                    {isCompleted ? '\u2713' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary leading-snug">{step.title}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-text-muted bg-white/60 px-2 py-1 rounded-full shrink-0">
                    <Clock size={10} />{step.durationMinutes}m
                  </span>
                </div>
                {i < steps.length - 1 && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sage-200" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
