import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { MoodLevel, EnergyLevel } from '../types';

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

export function MoodScreen() {
  const { currentSession, setMood, setScreen } = useAppStore();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel | null>(null);

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => setScreen('home')}>Go back</Button>
      </div>
    );
  }

  const handleContinue = () => {
    if (selectedMood && selectedEnergy) {
      setMood(selectedMood, selectedEnergy);
    }
    setScreen('breakdown');
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-lg"
      >
        <button
          onClick={() => setScreen('home')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-14 h-14 bg-warm-50 rounded-3xl mb-5"
          >
            <Sparkles size={24} className="text-warm-400" />
          </motion.div>
          <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-2">
            Before we start
          </h1>
          <p className="text-text-secondary">
            A quick check-in helps me tailor your session.
          </p>
        </motion.div>

        <Card className="mb-6">
          <p className="text-sm text-text-muted mb-3 uppercase tracking-wide font-medium">Mood</p>
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m, i) => (
              <motion.button
                key={m.level}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => setSelectedMood(m.level)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors cursor-pointer group ${
                  selectedMood === m.level
                    ? 'bg-sage-100 ring-2 ring-sage-400'
                    : 'hover:bg-cream-100'
                }`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{m.emoji}</span>
                <span className="text-xs text-text-muted">{m.label}</span>
              </motion.button>
            ))}
          </div>
        </Card>

        <Card className="mb-8">
          <p className="text-sm text-text-muted mb-3 uppercase tracking-wide font-medium">Energy</p>
          <div className="grid grid-cols-5 gap-2">
            {energies.map((e, i) => (
              <motion.button
                key={e.level}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i + 0.25 }}
                onClick={() => setSelectedEnergy(e.level)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors cursor-pointer group ${
                  selectedEnergy === e.level
                    ? 'bg-sage-100 ring-2 ring-sage-400'
                    : 'hover:bg-cream-100'
                }`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{e.emoji}</span>
                <span className="text-xs text-text-muted">{e.label}</span>
              </motion.button>
            ))}
          </div>
        </Card>

        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full"
          disabled={!selectedMood || !selectedEnergy}
        >
          See my breakdown
        </Button>
      </motion.div>
    </div>
  );
}
