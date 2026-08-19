import { useState } from 'react';
import { AlertCircle, Archive, CalendarClock, CornerUpLeft } from 'lucide-react';
import type { ParkedStatus } from '../types';

const QUICK_DISTRACTIONS = ['Phone', 'Social media', 'Daydreaming', 'Snack', 'Noise', 'Anxiety', 'Boredom', 'Task switching'];

interface DistractionButtonProps {
  onLog: (label: string) => void;
  onPark?: (label: string, status: ParkedStatus) => void;
}

export function DistractionButton({ onLog, onPark }: DistractionButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const close = () => {
    setShowPicker(false);
    setPicked(null);
  };

  const handlePick = (label: string) => {
    onLog(label);
    setJustLogged(true);
    if (onPark) {
      setPicked(label);
    } else {
      setShowPicker(false);
    }
    setTimeout(() => setJustLogged(false), 2000);
  };

  const handlePark = (status: ParkedStatus) => {
    if (onPark && picked) onPark(picked, status);
    close();
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

      {showPicker && !picked && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface border border-cream-200 rounded-2xl shadow-lg p-3 z-50 min-w-[240px] animate-fade-in">
          <p className="text-xs text-text-muted mb-2 px-1">What pulled you away?</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_DISTRACTIONS.map((label) => (
              <button key={label} onClick={() => handlePick(label)} className="text-left text-sm px-3 py-2 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer text-text-primary">
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
                  handlePick((e.target as HTMLInputElement).value.trim());
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim()) handlePick(e.target.value.trim());
                else close();
              }}
            />
          </div>
        </div>
      )}

      {showPicker && picked && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface border border-cream-200 rounded-2xl shadow-lg p-3 z-50 min-w-[240px] animate-fade-in">
          <p className="text-xs text-text-muted mb-2 px-1">
            "{picked}" — what do you want to do?
          </p>
          <div className="space-y-1.5">
            <button
              onClick={() => handlePark('parked')}
              className="flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer text-text-primary"
            >
              <Archive size={15} className="text-text-muted" />
              Park it — deal with it later
            </button>
            <button
              onClick={() => handlePark('later_today')}
              className="flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer text-text-primary"
            >
              <CalendarClock size={15} className="text-text-muted" />
              Handle later today
            </button>
            <button
              onClick={() => { setPicked(null); setShowPicker(false); }}
              className="flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer text-text-primary"
            >
              <CornerUpLeft size={15} className="text-text-muted" />
              Return to task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}