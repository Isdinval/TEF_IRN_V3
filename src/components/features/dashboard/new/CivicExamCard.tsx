"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { mentionLabel, EXAM_PASS_THRESHOLD, EXAM_QUESTION_COUNT } from "@/lib/civic-constants";
import { InfoTooltip } from "./InfoTooltip";

interface LastAttempt {
  score: number;
  total_questions: number;
  passed: boolean;
  mention: string;
}

export function CivicExamCard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [dueCount, setDueCount] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<LastAttempt | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setLoading(false); return; }

      const [{ count }, { data: attempts }] = await Promise.all([
        supabase
          .from("user_civic_reviews")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .lte("next_review_at", new Date().toISOString()),
        supabase
          .from("civic_exam_attempts")
          .select("score, total_questions, passed, mention")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      if (!active) return;
      setDueCount(count || 0);
      setLastAttempt(attempts?.[0] || null);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [supabase]);

  if (loading) return null;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
            <Landmark size={14} /> Examen Civique
          </h3>
          <p className="text-xl font-black text-zinc-900 tracking-tight">
            {dueCount > 0
              ? `${dueCount} question${dueCount > 1 ? "s" : ""} à réviser`
              : lastAttempt
              ? "Prêt pour un nouvel entraînement ?"
              : "Préparez votre entretien civique"}
          </p>
        </div>

        {lastAttempt && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${lastAttempt.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {lastAttempt.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            </div>
            <div>
              <p className="text-xs font-black text-zinc-900">
                Dernier examen blanc : {lastAttempt.score}/{lastAttempt.total_questions}
              </p>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {mentionLabel(lastAttempt.mention)}
                <InfoTooltip text={`Seuil de réussite : ${EXAM_PASS_THRESHOLD}/${EXAM_QUESTION_COUNT} questions. Le libellé ci-contre indique la démarche visée (CSP/CR/Naturalisation), pas une mention scolaire.`} />
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={() => router.push("/examen-civique")}
          variant="outline"
          className="h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
        >
          {dueCount > 0 ? "Réviser maintenant" : "Accéder à l'examen civique"} <ArrowRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}
