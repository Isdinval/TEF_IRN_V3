"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useCivicContext, DEFAULT_THEME } from "@/components/features/examen-civique/useCivicContext";
import { THEMES } from "@/lib/civic-constants";
import { getLocalMasteryMap } from "@/lib/civic-local-store";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface CivicQuestion {
  id: string;
  theme: string;
  mentions: string[];
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  source_ref: string | null;
  source_url: string | null;
}

type QuestionStatus = "new" | "learning" | "mastered";

const STATUS_CONFIG: Record<QuestionStatus, { label: string; className: string }> = {
  new: { label: "Nouveau", className: "bg-zinc-100 text-zinc-500" },
  learning: { label: "En cours", className: "bg-amber-50 text-amber-600" },
  mastered: { label: "Maîtrisé", className: "bg-emerald-50 text-emerald-600" },
};

function CivicCatalogueContent() {
  const supabase = useMemo(() => createClient(), []);
  const { mention, theme, setTheme } = useCivicContext();

  const [questions, setQuestions] = useState<CivicQuestion[]>([]);
  const [status, setStatus] = useState<Record<string, QuestionStatus>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        let query = supabase.from("civic_questions").select("*").order("theme");
        query = query.contains("mentions", [mention]);
        if (theme !== DEFAULT_THEME) query = query.eq("theme", theme);
        const { data, error } = await query;
        if (error) throw error;

        const questionsData = (data as CivicQuestion[]) || [];
        if (!active) return;
        setQuestions(questionsData);

        const { data: { user } } = await supabase.auth.getUser();
        const statusMap: Record<string, QuestionStatus> = {};
        if (user && questionsData.length > 0) {
          const { data: reviews } = await supabase
            .from("user_civic_reviews")
            .select("question_id, consecutive_correct")
            .eq("user_id", user.id)
            .in("question_id", questionsData.map((q) => q.id));
          (reviews || []).forEach((r: { question_id: string; consecutive_correct: number | null }) => {
            statusMap[r.question_id] = (r.consecutive_correct || 0) >= 2 ? "mastered" : "learning";
          });
        } else if (!user && questionsData.length > 0) {
          const localMap = getLocalMasteryMap();
          questionsData.forEach((q) => { if (localMap[q.id]) statusMap[q.id] = localMap[q.id]; });
        }
        if (active) setStatus(statusMap);
      } catch (err) {
        console.error("Error loading civic catalogue:", err);
        if (active) setErrorMsg("Impossible de charger le catalogue. Réessayez.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [mention, theme, supabase]);

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

        {loading && (
          <div className="mt-8 p-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        )}

        {!loading && errorMsg && (
          <div className="mt-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
            {errorMsg}
          </div>
        )}

        {!loading && !errorMsg && questions.length === 0 && (
          <div className="mt-8 p-12 text-center border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-zinc-400 font-bold text-sm">
            Aucune question ne correspond à ces filtres.
          </div>
        )}

        {!loading && !errorMsg && questions.length > 0 && (
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
                        <AccordionContent className="pb-5 space-y-3 pl-1">
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

export function CivicCatalogue() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <CivicCatalogueContent />
    </Suspense>
  );
}
