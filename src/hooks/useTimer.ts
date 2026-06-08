'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseTimerProps {
  duration: number; // in seconds
  startedAt?: number; // timestamp in ms
  onTimeUp?: () => void;
  isActive: boolean;
}

export function useTimer({ duration, startedAt, onTimeUp, isActive }: UseTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(duration);

  const calculateTimeLeft = useCallback(() => {
    if (!startedAt) return duration;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = duration - elapsed;
    return Math.max(0, remaining);
  }, [duration, startedAt]);

  useEffect(() => {
    if (!isActive || !startedAt) {
      setTimeLeft(duration);
      return;
    }

    // Initial sync
    const initialRemaining = calculateTimeLeft();
    setTimeLeft(initialRemaining);

    if (initialRemaining <= 0) {
      onTimeUp?.();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startedAt, calculateTimeLeft, onTimeUp, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    formatTime: formatTime(timeLeft),
    isLowTime: timeLeft < 300, // < 5 minutes
  };
}
