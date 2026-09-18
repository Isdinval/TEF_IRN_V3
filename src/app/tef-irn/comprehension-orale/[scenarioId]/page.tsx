'use client';

// Session de pratique pour 1 sujet de Compréhension Orale. Miroir exact de
// comprehension-ecrite/[scenarioId]/page.tsx (voir ses commentaires) --
// seule différence : lecteur audio (composant existant, réutilisé tel
// quel) à la place du texte/sous-textes.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/exam/AudioPlayer';
import { ChevronLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface CoScenario {
  id: string;
  format: string;
  level: string;
  title: string | null;
  audio_url: string;
  max_plays: number | null;
}
interface CoQuestion {
  id: string;
  order_index: number;
  question: string;
  options: string[];
}
interface GradedResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
}

export default function ComprehensionOraleScenarioPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [scenario, setScenario] = useState<CoScenario | null>(null);
  const [questions, setQuestions] = useState<CoQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, GradedResult> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const [{ data: scenarioRow }, { data: questionRows }] = await Promise.all([
        supabase.from('co_scenarios').select('id, format, level, title, audio_url, max_plays').eq('id', scenarioId).maybeSingle(),
        supabase.from('co_scenario_questions_public').select('id, order_index, question, options').eq('scenario_id', scenarioId).order('order_index'),
      ]);
      if (!active) return;
      if (!scenarioRow) {
        setError(true);
        setLoading(false);
        return;
      }
      setScenario(scenarioRow as CoScenario);
      setQuestions((questionRows || []) as CoQuestion[]);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [scenarioId, supabase]);

  const handleSubmit = async () => {
    if (submitting || Object.keys(answers).length < questions.length) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comprehension/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: 'CO',
          results: questions.map((q) => ({ questionId: q.id, userAnswer: answers[q.id] || '' })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de correction');
      const byId: Record<string, GradedResult> = {};
      data.results.forEach((r: GradedResult) => { byId[r.questionId] = r; });
      setResults(byId);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }
  if (error || !scenario) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="font-bold text-zinc-600">Impossible de charger ce sujet.</p>
        <Link href="/tef-irn/comprehension-orale" className="text-indigo-600 font-black text-sm">Retour au catalogue</Link>
      </div>
    );
  }

  const score = results ? Object.values(results).filter((r) => r.isCorrect).length : 0;

  return (
    <div className="min-h-screen bg-slate-50/30 pb-24">
      <div className="mx-auto max-w-3xl p-4 md:p-10">
        <Link href="/tef-irn/comprehension-orale" className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition-colors mb-6">
          <ChevronLeft size={14} /> Catalogue Compréhension Orale
        </Link>

        <div className="mb-6 flex items-center gap-2">
          <Badge className="rounded-full border-none bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            Niveau {scenario.level}
          </Badge>
          {results && (
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
              {score} / {questions.length}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 mb-6">{scenario.title}</h1>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 mb-6">
          <AudioPlayer url={scenario.audio_url} maxPlays={scenario.max_plays || 2} questionId={scenario.id} />
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const graded = results?.[q.id];
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="font-bold text-zinc-900 text-sm">Question {i + 1} — {q.question}</p>
                  {graded && (graded.isCorrect ? <CheckCircle2 className="text-emerald-500 shrink-0" size={20} /> : <XCircle className="text-red-400 shrink-0" size={20} />)}
                </div>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    const isCorrectOpt = graded?.correctAnswer === opt;
                    return (
                      <button
                        key={opt}
                        disabled={!!results}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          results
                            ? isCorrectOpt
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : isSelected
                                ? 'border-red-300 bg-red-50 text-red-600'
                                : 'border-zinc-100 text-zinc-400'
                            : isSelected
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                              : 'border-zinc-200 text-zinc-600 hover:border-indigo-200'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {graded?.explanation && (
                  <p className="mt-3 text-xs font-medium text-zinc-500 bg-zinc-50 rounded-xl p-3">{graded.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        {!results ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < questions.length}
            className="mt-6 w-full h-12 rounded-2xl bg-zinc-900 font-black hover:bg-indigo-600"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Corriger'}
          </Button>
        ) : (
          <Button
            onClick={() => router.push('/tef-irn/comprehension-orale')}
            className="mt-6 w-full h-12 rounded-2xl bg-zinc-900 font-black hover:bg-indigo-600"
          >
            Voir d&apos;autres sujets
          </Button>
        )}
      </div>
    </div>
  );
}
