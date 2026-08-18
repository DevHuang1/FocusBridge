import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface TextInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function TextInput({ placeholder = "I need to…", onSubmit, disabled }: TextInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          className="w-full px-6 py-5 text-lg bg-surface border-2 border-cream-200 rounded-3xl resize-none focus:border-sage-400 focus:outline-none transition-colors duration-200 placeholder:text-text-muted disabled:opacity-50"
        />
        <AnimatePresence>
          {value.trim() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={disabled}
              className="absolute right-4 bottom-4 p-3 bg-sage-500 text-white rounded-2xl hover:bg-sage-600 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Sparkles size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-sm text-text-muted text-center">
        Press Enter or tap the button to get started
      </p>
    </div>
  );
}
