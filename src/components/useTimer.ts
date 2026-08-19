import { useState, useEffect, useCallback } from 'react';

export function useTimer(initialMinutes: number, mode: 'countdown' | 'countup' = 'countdown') {
  const totalSeconds = initialMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(mode === 'countdown' ? totalSeconds : 0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setSecondsLeft(mode === 'countdown' ? totalSeconds : 0);
    setElapsed(0);
    setIsRunning(false);
  }, [totalSeconds, mode]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
      if (mode === 'countdown') {
        setSecondsLeft((s) => {
          if (s <= 1) {
            setIsRunning(false);
            return 0;
          }
          return s - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setSecondsLeft(mode === 'countdown' ? totalSeconds : 0);
    setElapsed(0);
    setIsRunning(false);
  }, [totalSeconds, mode]);

  const progress = mode === 'countdown' && totalSeconds > 0 ? elapsed / totalSeconds : 0;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    secondsLeft,
    isRunning,
    start,
    pause,
    reset,
    progress,
    formatted: formatTime(mode === 'countdown' ? secondsLeft : elapsed),
    elapsedFormatted: formatTime(elapsed),
    elapsedSeconds: elapsed,
    isComplete: mode === 'countdown' && secondsLeft === 0 && elapsed > 0,
  };
}