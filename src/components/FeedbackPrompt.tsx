import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { FeedbackLevel } from '../types';

interface FeedbackPromptProps {
  onFeedback: (level: FeedbackLevel) => void;
}

const options: { level: FeedbackLevel; emoji: string; label: string }[] = [
  { level: 'easy', emoji: '😊', label: 'Easy' },
  { level: 'okay', emoji: '😐', label: 'Okay' },
  { level: 'too_much', emoji: '😣', label: 'Too much' },
];

export function FeedbackPrompt({ onFeedback }: FeedbackPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface border border-cream-200 rounded-3xl p-8 max-w-md mx-auto text-center shadow-sm"
    >
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-warm-50 rounded-2xl">
          <Heart size={24} className="text-warm-400" />
        </div>
      </div>
      <h3 className="text-xl font-serif text-text-primary mb-2">How did that feel?</h3>
      <p className="text-text-secondary mb-6">This helps me adjust the next step.</p>
      <div className="flex gap-3 justify-center">
        {options.map((opt) => (
          <motion.button
            key={opt.level}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFeedback(opt.level)}
            className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 border-cream-200 hover:border-sage-300 transition-colors cursor-pointer"
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-sm font-medium text-text-secondary">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
