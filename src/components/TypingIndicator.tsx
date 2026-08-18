import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  label?: string;
}

export function TypingIndicator({ label = 'Thinking' }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 px-6 py-4 bg-sage-50 rounded-2xl max-w-xs"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-sage-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span className="text-sm text-sage-500">{label}...</span>
    </motion.div>
  );
}
