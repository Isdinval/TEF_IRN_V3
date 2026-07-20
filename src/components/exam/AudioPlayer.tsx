'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface AudioPlayerProps {
  url: string;
  maxPlays: number;
  questionId: string;
}

export function AudioPlayer({ url, maxPlays, questionId }: AudioPlayerProps) {
  const [plays, setPlays] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when question changes
  useEffect(() => {
    setPlays(0);
    setIsPlaying(false);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [questionId]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (plays >= maxPlays && audioRef.current.currentTime === 0) return;

      audioRef.current.play();
      setIsPlaying(true);
      if (audioRef.current.currentTime === 0) {
        setPlays(prev => prev + 1);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration;
    setProgress((current / total) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  const canPlay = plays < maxPlays || isPlaying;

  return (
    <div className="w-full bg-[var(--exam-paper)] border border-[var(--exam-line)] rounded-sm p-6 flex flex-col gap-4">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--exam-blue)]/10 text-[var(--exam-blue)] rounded-sm flex items-center justify-center">
            <Volume2 size={20} />
          </div>
          <div>
            <div className="font-[family-name:var(--exam-font-display)] font-semibold text-sm text-[var(--exam-ink)]">Document sonore</div>
            <div className="font-[family-name:var(--exam-font-mono)] text-xs font-bold text-[var(--exam-ink)]/45">
              {plays} / {maxPlays} écoutes effectuées
            </div>
          </div>
        </div>

        <Button
          onClick={togglePlay}
          disabled={!canPlay && progress === 0}
          className={`w-14 h-14 rounded-full shadow-lg transition-all ${isPlaying ? 'bg-[var(--exam-seal)] hover:bg-[var(--exam-seal)]/85' : 'bg-[var(--exam-blue)] hover:bg-[var(--exam-ink)]'}`}
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </Button>
      </div>

      <div className="space-y-1">
        <Progress value={progress} className="h-1.5 bg-[var(--exam-paper-dark)]" />
        <div className="flex justify-between font-[family-name:var(--exam-font-mono)] text-[10px] font-bold text-[var(--exam-ink)]/40">
          <span>0:00</span>
          <span>{duration ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}</span>
        </div>
      </div>

      {!canPlay && (
        <div className="text-center font-[family-name:var(--exam-font-mono)] text-xs font-bold text-[var(--exam-seal)] bg-[var(--exam-seal)]/5 py-2 rounded-sm border border-[var(--exam-seal)]/20">
          Limite d'écoutes atteinte
        </div>
      )}
    </div>
  );
}
