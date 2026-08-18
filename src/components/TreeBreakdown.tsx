import { motion } from 'framer-motion';
import type { TaskStep } from '../types';
import { Clock } from 'lucide-react';

interface TreeBreakdownProps {
  goalTitle: string;
  steps: TaskStep[];
}

function AnimatedLine({ delay }: { delay: number }) {
  return (
    <svg
      width="2"
      height="36"
      className="block mx-auto"
      style={{ overflow: 'visible' }}
    >
      <motion.line
        x1="1"
        y1="0"
        x2="1"
        y2="36"
        stroke="#C9D9C9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="36"
        strokeDashoffset="36"
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      />
    </svg>
  );
}

export function TreeBreakdown({ goalTitle, steps }: TreeBreakdownProps) {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Root node — goal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative"
      >
        <div className="bg-sage-500 text-white px-5 py-3 rounded-2xl max-w-xs text-center shadow-sm">
          <p className="font-serif text-sm md:text-base leading-snug">{goalTitle}</p>
        </div>
      </motion.div>

      {/* Connecting lines + step nodes */}
      <div className="flex flex-col items-center mt-1">
        {steps.map((step, i) => {
          const lineDelay = i * 0.25 + 0.3;
          const nodeDelay = i * 0.25 + 0.45;
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isStuck = step.status === 'stuck';
          const isSkipped = step.status === 'skipped';

          return (
            <div key={step.id} className="flex flex-col items-center">
              {/* Animated line growing from parent */}
              <AnimatedLine delay={lineDelay} />

              {/* Step node */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                  delay: nodeDelay,
                }}
                className="relative"
              >
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
                    ${
                      isCompleted
                        ? 'bg-sage-50 border-sage-200 opacity-60'
                        : isActive
                        ? 'bg-cream-50 border-sage-300 shadow-sm'
                        : isStuck
                        ? 'bg-cream-50 border-cream-300 border-dashed opacity-50'
                        : isSkipped
                        ? 'bg-cream-50 border-cream-200 opacity-30'
                        : 'bg-cream-50 border-cream-200'
                    }
                  `}
                >
                  {/* Step number dot */}
                  <div
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                      ${
                        isCompleted
                          ? 'bg-sage-200 text-sage-600'
                          : isActive
                          ? 'bg-sage-400 text-white'
                          : 'bg-cream-200 text-text-muted'
                      }
                    `}
                  >
                    {isCompleted ? '\u2713' : i + 1}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary leading-snug">
                      {step.title}
                    </p>
                  </div>

                  {/* Duration badge */}
                  <span className="flex items-center gap-1 text-xs text-text-muted bg-white/60 px-2 py-1 rounded-full shrink-0">
                    <Clock size={10} />
                    {step.durationMinutes}m
                  </span>
                </div>

                {/* Subtle dot connector below node */}
                {i < steps.length - 1 && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sage-200" />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
