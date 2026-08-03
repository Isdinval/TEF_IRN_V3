'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col gap-3">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Volume2 size={20} />
          </div>
          <div>
            <div className="font-black text-sm text-zinc-900">Document sonore</div>
            <div className="text-xs font-bold text-zinc-400">
              {plays} / {maxPlays} écoutes effectuées
            </div>
          </div>
        </div>

        <Button
          onClick={togglePlay}
          disabled={!canPlay && progress === 0}
          className={`w-11 h-11 rounded-full shadow-lg transition-all ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
        </Button>
      </div>

      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-zinc-400">
          <span>0:00</span>
          <span>{duration ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}</span>
        </div>
      </div>

      {!canPlay && (
        <div className="text-center text-xs font-bold text-rose-600 bg-rose-50 py-2 rounded-xl border border-rose-100">
          Limite d'écoutes atteinte
        </div>
      )}
    </div>
  );
}
