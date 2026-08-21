'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TEST_AUDIO_URL =
  'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/test_audio/test_audio.mp3';

/**
 * Test audio autonome affiché sur le briefing initial de l'épreuve CO.
 *
 * Indépendant du ExamContext : ne consomme aucune écoute et ne touche à
 * aucun compteur d'épreuve (contrairement à AudioPlayer). Permet à
 * l'utilisateur de vérifier que son volume/casque fonctionne avant de
 * démarrer l'épreuve chronométrée, pour éviter de perdre une écoute sur
 * une question réelle à cause d'un problème purement technique.
 */
export function AudioCheckWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasPlayed(true);
  };

  return (
    <div className="flex items-center justify-between gap-4 p-5 bg-amber-50/60 rounded-2xl border border-amber-100">
      <audio ref={audioRef} src={TEST_AUDIO_URL} onEnded={handleEnded} />

      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isPlaying ? 'bg-amber-500 text-white animate-pulse' : 'bg-white text-amber-600'
          }`}
        >
          <Volume2 size={18} />
        </div>
        <div className="min-w-0">
          <div className="font-black text-sm text-zinc-900">Vérifiez votre son</div>
          <div className="text-xs font-bold text-zinc-500 truncate">
            {hasPlayed ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={12} /> Vous êtes prêt(e) !
              </span>
            ) : (
              "Lancez un son test avant de commencer."
            )}
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={togglePlay}
        variant="outline"
        className="h-10 rounded-full shrink-0 border-amber-200 bg-white hover:bg-amber-100 font-bold text-xs px-4"
      >
        {isPlaying ? (
          <>
            <Pause size={14} className="mr-1.5" fill="currentColor" /> Stop
          </>
        ) : (
          <>
            <Play size={14} className="mr-1.5" fill="currentColor" /> {hasPlayed ? 'Réécouter' : 'Tester mon audio'}
          </>
        )}
      </Button>
    </div>
  );
}
