import React, { useState, useEffect, useRef } from 'react';
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
      setValue('');
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
          aria-label={placeholder}
          className="w-full px-7 py-5 text-lg bg-surface border-2 border-cream-200/80 rounded-[1.5rem] resize-none focus:outline-none transition-all duration-250 placeholder:text-text-muted disabled:opacity-50 focus:border-[var(--color-theme-primary)] focus:shadow-[0_0_0_3px_var(--color-theme-primary-light)]"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Submit"
          className={`absolute right-4 bottom-4 p-3.5 text-white rounded-[1rem] transition-all duration-200 cursor-pointer shadow-sm ${
            value.trim() ? 'opacity-100 scale-100 hover:brightness-110 active:scale-95' : 'opacity-0 scale-90 pointer-events-none'
          }`}
          style={{ backgroundColor: 'var(--color-theme-primary)' }}
        >
          <Sparkles size={20} />
        </button>
      </div>
      <p className="mt-3 text-sm text-text-muted text-center">
        Press Enter or tap the button to get started
      </p>
    </div>
  );
}
