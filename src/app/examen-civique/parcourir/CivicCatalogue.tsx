"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useCivicContext, DEFAULT_THEME } from "@/components/features/examen-civique/useCivicContext";
import { THEMES } from "@/lib/civic-constants";
import { getLocalMasteryMap } from "@/lib/civic-local-store";
import type { CivicQuestion } from "@/lib/civic-questions";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type QuestionStatus = "new" | "learning" | "mastered";

const STATUS_CONFIG: Record<QuestionStatus, { label: string; className: string }> = {
  new: { label: "Nouveau", className: "bg-zinc-100 text-zinc-500" },
  learning: { label: "En cours", className: "bg-amber-50 text-amber-600" },
  mastered: { label: "Maîtrisé", className: "bg-emerald-50 text-emerald-600" },
};

function CivicCatalogueContent({ initialQuestions }: { initialQuestions: CivicQuestion[] }) {
  const supabase = useMemo(() => createClient(), []);
  const { mention, theme, setTheme } = useCivicContext();

  const [status, setStatus] = useState<Record<string, QuestionStatus>>({});

  // Les questions sont déjà chargées côté serveur (toutes démarches/thématiques confondues) —
  // le filtre mention/thème se fait ici en mémoire, sans nouvel aller-retour réseau.
  const questions = useMemo(
    () => initialQuestions.filter((q) => q.mentions.includes(mention) && (theme === DEFAULT_THEME || q.theme === theme)),
    [initialQuestions, mention, theme]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      if (questions.length === 0) { setStatus({}); return; }
      const { data: { user } } = await supabase.auth.getUser();
      const statusMap: Record<string, QuestionStatus> = {};
      if (user) {
        const { data: reviews } = await supabase
          .from("user_civic_reviews")
          .select("question_id, consecutive_correct")
          .eq("user_id", user.id)
          .in("question_id", questions.map((q) => q.id));
        (reviews || []).forEach((r: { question_id: string; consecutive_correct: number | null }) => {
          statusMap[r.question_id] = (r.consecutive_correct || 0) >= 2 ? "mastered" : "learning";
        });
      } else {
        const localMap = getLocalMasteryMap();
        questions.forEach((q) => { if (localMap[q.id]) statusMap[q.id] = localMap[q.id]; });
      }
      if (active) setStatus(statusMap);
    })();
    return () => { active = false; };
  }, [questions, supabase]);

  const groupedByTheme = THEMES.map((t) => ({
    theme: t,
    items: questions.filter((q) => q.theme === t.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-8 lg:px-10">
        <ExerciseLayout
          title={<>Parcourez les <span className="text-indigo-600">questions officielles</span></>}
          badge="Catalogue complet"
          description="Réponse, explication et source pour chaque question, classées par thématique. Idéal pour découvrir un sujet ou vérifier une réponse."
        />

        {/* Filtre thématique — évite l'aller-retour vers le sommaire pour changer de thème */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[DEFAULT_THEME, ...THEMES.map((t) => t.value)].map((val) => (
            <button
              key={val}
              onClick={() => setTheme(val)}
              className={`px-3 h-7 rounded-xl font-black text-[10px] transition-all ${theme === val ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
            >
              {val === DEFAULT_THEME ? "Toutes" : THEMES.find((t) => t.value === val)?.label}
            </button>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="mt-8 p-12 text-center border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-zinc-400 font-bold text-sm">
            Aucune question ne correspond à ces filtres.
          </div>
        )}

        {questions.length > 0 && (
          <div className="mt-6 space-y-8">
            {groupedByTheme.map((group) => (
              <section key={group.theme.value}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-sm font-black uppercase tracking-tight text-zinc-900">{group.theme.label}</h2>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {group.items.length} question{group.items.length > 1 ? "s" : ""}
                  </span>
                </div>
                <Accordion className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50 px-6">
                  {group.items.map((q) => {
                    const qStatus = status[q.id] || "new";
                    return (
                      <AccordionItem key={q.id} value={q.id} className="border-none">
                        <AccordionTrigger className="hover:no-underline py-4 gap-4">
                          <div className="flex items-center gap-3 text-left flex-1">
                            <Badge className={`shrink-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${STATUS_CONFIG[qStatus].className}`}>
                              {STATUS_CONFIG[qStatus].label}
                            </Badge>
                            <span className="text-sm font-bold text-zinc-800">{q.question}</span>
                          </div>
                        </AccordionTrigger>
                        {/* hiddenUntilFound (plutôt que le défaut, qui démonte le panneau fermé du DOM) :
                            garde la réponse/explication dans le HTML même repliée — visible par les
                            crawlers qui n'exécutent pas de JS, et compatible avec le Ctrl+F du navigateur. */}
                        <AccordionContent className="pb-5 space-y-3 pl-1" hiddenUntilFound>
                          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-sm">
                            {q.correct_answer}
                          </div>
                          {q.explanation && <p className="text-xs text-zinc-500 italic leading-relaxed">{q.explanation}</p>}
                          {q.source_url && (
                            <a href={q.source_url} target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">
                              Source officielle →
                            </a>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CivicCatalogue({ initialQuestions }: { initialQuestions: CivicQuestion[] }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <CivicCatalogueContent initialQuestions={initialQuestions} />
    </Suspense>
  );
}
