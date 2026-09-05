"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Sparkles, Loader2 } from "lucide-react";
import ExerciseCard from "@/app/tef-irn/parcours/[slug]/components/ExerciseCard";
import { resolveNextExercises, ScoredExercise } from "@/lib/recommendation-resolver";
import { buildExamWeakPointsContext } from "@/app/tef-irn/correction/lib/build-reco-context";

// Bloc E de l'item 4 ("remontées LlamaKusi août 2026") : équivalent de
// RecommendedExercises.tsx (page /correction) mais pour l'écran de résultat
// d'examen blanc, affiché directement au moment le plus chaud (juste après
// avoir vu son score) plutôt que de nécessiter un détour par /correction --
// et couvre les 4 épreuves (CE/CO/EE/EO), pas seulement EE/EO comme sur
// /correction (voir buildExamWeakPointsContext, dérivé de user_errors).
export function ExamRecommendedExercises({ level }: { level: string }) {
  const [exercises, setExercises] = useState<ScoredExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function run() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const context = await buildExamWeakPointsContext(user.id, level, supabase);
      if (!context) {
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
  }, [level]);

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
