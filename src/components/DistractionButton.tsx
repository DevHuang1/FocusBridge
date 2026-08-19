import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const QUICK_DISTRACTIONS = ['Phone', 'Social media', 'Daydreaming', 'Snack', 'Noise', 'Anxiety', 'Boredom', 'Task switching'];

interface DistractionButtonProps {
  onLog: (label: string) => void;
}

export function DistractionButton({ onLog }: DistractionButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  const handleLog = (label: string) => {
    onLog(label);
    setShowPicker(false);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warm-50 text-warm-500 hover:bg-warm-100 transition-colors text-sm cursor-pointer active:scale-95"
      >
        <AlertCircle size={16} />
        {justLogged ? 'Logged!' : 'Got distracted'}
      </button>

      {showPicker && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface border border-cream-200 rounded-2xl shadow-lg p-3 z-50 min-w-[240px] animate-fade-in">
          <p className="text-xs text-text-muted mb-2 px-1">What pulled you away?</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_DISTRACTIONS.map((label) => (
              <button key={label} onClick={() => handleLog(label)} className="text-left text-sm px-3 py-2 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer text-text-primary">
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-cream-100">
            <input
              autoFocus
              placeholder="Something else..."
              className="w-full text-sm px-3 py-2 rounded-xl bg-cream-50 focus:outline-none text-text-primary placeholder:text-text-muted"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  handleLog((e.target as HTMLInputElement).value.trim());
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim()) handleLog(e.target.value.trim());
                else setShowPicker(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
