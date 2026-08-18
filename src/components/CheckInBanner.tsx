import { motion, AnimatePresence } from 'framer-motion';

interface CheckInBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function CheckInBanner({ message, onDismiss }: CheckInBannerProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mx-auto max-w-2xl px-4 pt-4">
            <div className="bg-sage-50 border border-sage-200 rounded-2xl px-6 py-4 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sage-400 mt-2 shrink-0" />
              <p className="text-sage-600 flex-1">{message}</p>
              <button
                onClick={onDismiss}
                className="text-sage-400 hover:text-sage-600 transition-colors text-sm shrink-0 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
