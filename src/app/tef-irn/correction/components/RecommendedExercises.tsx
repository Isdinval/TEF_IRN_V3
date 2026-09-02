"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Sparkles, Loader2 } from "lucide-react";
import ExerciseCard from "../../parcours/[slug]/components/ExerciseCard";
import { resolveNextExercises, ScoredExercise } from "@/lib/recommendation-resolver";
import { ExerciseAttempt } from "@/types/writing";
import { buildRecoContext } from "../lib/build-reco-context";

// Item 7 du plan "Refonte page Correction" : "on rajoute aussi des exos
// recommandés ici ?" (demande d'Olivier sur la vue détail). Réutilise
// resolveNextExercises + ExerciseCard tels quels (déjà en prod sur
// /lessons/[slug]/complete) -- pas de nouveau moteur de recommandation, juste
// un contexte dérivé de CETTE tentative (voir build-reco-context.ts) plutôt
// que de la leçon en cours.
export function RecommendedExercises({ attempt }: { attempt: ExerciseAttempt }) {
  const [exercises, setExercises] = useState<ScoredExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function run() {
      const context = buildRecoContext(attempt);
      if (!context) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const results = await resolveNextExercises(user.id, context, supabase, 3);
      if (!cancelled) {
        setExercises(results);
        setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-zinc-300">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (exercises.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-zinc-400 px-4">
        <Sparkles size={18} className="text-indigo-600" />
        Exercices recommandés pour progresser
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exercises.map(exercise => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>
    </div>
  );
}
