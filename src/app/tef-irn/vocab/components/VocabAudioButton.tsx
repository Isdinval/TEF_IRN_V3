"use client";

import { useRef, useState } from "react";
import { Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VocabAudioButtonProps {
  audioUrl?: string | null;
  className?: string;
  variant?: "light" | "dark";
  /** Appelé quand la lecture démarre (pas à la pause). Utilisé côté recto
   * pour retourner la carte en même temps que le mot est prononcé. Omis
   * côté verso pour ne pas re-plier la carte à chaque écoute. */
  onPlay?: () => void;
}

/**
 * Bouton de prononciation d'un mot, utilisé sur les deux faces de la
 * flashcard (page /tef-irn/vocab). Stoppe toujours la propagation du clic
 * vers le wrapper de la carte (qui gère le flip via son propre onClick) :
 * le flip déclenché par ce bouton passe uniquement par le callback
 * explicite `onPlay`, jamais par la propagation native de l'événement.
 */
export default function VocabAudioButton({ audioUrl, className = "", variant = "light", onPlay }: VocabAudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasAudio = !!audioUrl;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasAudio || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
    onPlay?.();
  };

  const colors =
    variant === "dark"
      ? "bg-white/10 text-white hover:bg-emerald-500 hover:text-white"
      : "bg-zinc-50 text-zinc-900 hover:bg-emerald-600 hover:text-white";

  return (
    <>
      {hasAudio && (
        <audio
          ref={audioRef}
          src={audioUrl!}
          onEnded={() => setIsPlaying(false)}
        />
      )}
      <Button
        type="button"
        size="icon"
        variant="secondary"
        disabled={!hasAudio}
        onClick={handleClick}
        aria-label="Écouter la prononciation"
        className={`rounded-full h-12 w-12 transition-colors disabled:opacity-40 ${colors} ${className}`}
      >
        {isPlaying ? <Loader2 size={24} className="animate-spin" /> : <Volume2 size={24} />}
      </Button>
    </>
  );
}
