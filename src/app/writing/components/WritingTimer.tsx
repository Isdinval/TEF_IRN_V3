"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface WritingTimerProps {
  exerciseId?: string;
  instructions: string;
}

export const WritingTimer = ({ exerciseId, instructions }: WritingTimerProps) => {
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Détection de la section
  useEffect(() => {
    let newDuration = 25 * 60;
    if (instructions.toLowerCase().includes("section b")) {
      newDuration = 45 * 60;
    } else if (instructions.toLowerCase().includes("section a")) {
      newDuration = 25 * 60;
    }
    setDuration(newDuration);

    // Charger l'état depuis le localStorage
    const saved = localStorage.getItem(`writing_timer_${exerciseId}`);
    if (saved) {
      const { timeLeft: savedTime, lastUpdate, isStarted: savedStarted } = JSON.parse(saved);
      const elapsed = Math.floor((Date.now() - lastUpdate) / 1000);
      const remaining = Math.max(0, savedTime - (savedStarted ? elapsed : 0));
      setTimeLeft(remaining);
      setIsStarted(savedStarted);
      // On ne relance pas automatiquement isActive, on attend que l'utilisateur appuie sur play s'il veut reprendre
      // ou on peut reprendre s'il était actif.
      // Pour ce projet, on va demander de cliquer sur play pour reprendre si c'était en cours ?
      // Non, la consigne dit "le timer reprend là où il en était".
      if (savedStarted && remaining > 0) {
          // Si on veut une vraie reprise automatique :
          // setIsActive(true);
      }
    } else {
      setTimeLeft(newDuration);
      setIsActive(false);
      setIsStarted(false);
    }
  }, [exerciseId, instructions]);

  // Sauvegarder l'état
  useEffect(() => {
    if (exerciseId && isStarted) {
      localStorage.setItem(`writing_timer_${exerciseId}`, JSON.stringify({
        timeLeft,
        lastUpdate: Date.now(),
        isStarted
      }));
    }
  }, [timeLeft, exerciseId, isStarted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    setIsActive(true);
    setIsStarted(true);
  };

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsStarted(false);
    setTimeLeft(duration);
    if (exerciseId) {
      localStorage.removeItem(`writing_timer_${exerciseId}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;
  const isLowTime = timeLeft < 120; // 2 minutes

  if (!isStarted) {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <TimerIcon size={20} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Chronomètre TEF</p>
          <p className="text-sm font-bold text-indigo-900">{duration / 60}:00 min disponibles</p>
        </div>
        <Button
          onClick={handleStart}
          className="rounded-xl bg-indigo-600 font-black uppercase tracking-tighter text-white hover:bg-indigo-700"
        >
          <Play size={16} className="mr-2" /> Démarrer le chrono
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-zinc-100 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            isLowTime ? "bg-rose-500 text-white" : "bg-zinc-900 text-white"
          }`}>
            <TimerIcon size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Temps restant</p>
            <p className={`text-2xl font-black tabular-nums tracking-tighter ${
              isLowTime ? "text-rose-600 animate-pulse" : "text-zinc-900"
            }`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggle}
            className="h-10 w-10 rounded-xl border-zinc-200"
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-10 w-10 rounded-xl text-zinc-400 hover:text-rose-500"
          >
            <RotateCcw size={18} />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
         <Progress
           value={progress}
           className={`h-2 transition-all ${isLowTime ? "[&>div]:bg-rose-500" : "[&>div]:bg-indigo-600"}`}
         />
         {timeLeft === 0 && (
           <p className="text-center text-[10px] font-black uppercase tracking-widest text-rose-600 animate-bounce mt-2">
             Temps écoulé pour cette section !
           </p>
         )}
      </div>
    </div>
  );
};
