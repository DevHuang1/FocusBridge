import { useState, useEffect, useCallback } from 'react';

export function useTimer(initialMinutes: number) {
  const totalSeconds = initialMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setIsRunning(false);
          return 0;
        }
        return s - 1;
      });
      setElapsed((e) => e + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setSecondsLeft(totalSeconds);
    setElapsed(0);
    setIsRunning(false);
  }, [totalSeconds]);

  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;

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
    formatted: formatTime(secondsLeft),
    elapsedFormatted: formatTime(elapsed),
    isComplete: secondsLeft === 0 && elapsed > 0,
  };
}
