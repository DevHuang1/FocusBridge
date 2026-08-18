import { motion } from 'framer-motion';
import type { MoodLevel, EnergyLevel } from '../types';

interface MoodPickerProps {
  onSelect: (mood: MoodLevel, energy: EnergyLevel) => void;
}

const moods: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 'drained', emoji: '😮‍💨', label: 'Drained' },
  { level: 'low', emoji: '😔', label: 'Low' },
  { level: 'okay', emoji: '😐', label: 'Okay' },
  { level: 'good', emoji: '🙂', label: 'Good' },
  { level: 'great', emoji: '😊', label: 'Great' },
];

const energies: { level: EnergyLevel; emoji: string; label: string }[] = [
  { level: 'exhausted', emoji: '🔋', label: 'Exhausted' },
  { level: 'low', emoji: '🪫', label: 'Low' },
  { level: 'medium', emoji: '⚡', label: 'Medium' },
  { level: 'high', emoji: '🔥', label: 'High' },
  { level: 'wired', emoji: '🚀', label: 'Wired' },
];

export function MoodPicker({ onSelect }: MoodPickerProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-text-muted mb-4 uppercase tracking-wide font-medium">How are you feeling?</p>
        <div className="grid grid-cols-5 gap-2">
          {moods.map((m, i) => (
            <motion.button
              key={m.level}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => onSelect(m.level, 'medium')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-cream-200 transition-colors cursor-pointer group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{m.emoji}</span>
              <span className="text-xs text-text-muted">{m.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MoodEnergyPicker({ onSelect: _onSelect }: { onSelect: (mood: MoodLevel, energy: EnergyLevel) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-text-muted mb-4 uppercase tracking-wide font-medium">How are you feeling?</p>
        <div className="grid grid-cols-5 gap-2">
          {moods.map((m, i) => (
            <motion.button
              key={m.level}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-cream-200 transition-colors cursor-pointer group"
              data-mood={m.level}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{m.emoji}</span>
              <span className="text-xs text-text-muted">{m.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-text-muted mb-4 uppercase tracking-wide font-medium">Energy level?</p>
        <div className="grid grid-cols-5 gap-2">
          {energies.map((e, i) => (
            <motion.button
              key={e.level}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i + 0.25 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-cream-200 transition-colors cursor-pointer group"
              data-energy={e.level}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{e.emoji}</span>
              <span className="text-xs text-text-muted">{e.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
