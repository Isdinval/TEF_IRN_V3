'use client';

// Catalogue de pratique Compréhension Écrite, dissocié de l'Examen Blanc
// (item 3 du plan "pratique CE/CO dissociée") : lit ce_scenarios /
// ce_scenario_questions_public (tables dédiées, indépendantes de
// exams/exam_questions), plus aucune dépendance à ExamContext/startExam.
//
// Filtre par Format (au lieu de Section, qui n'existe pas pour CE) --
// même position/style que le filtre Section sur
// writing/components/WritingScenarioCatalogue.tsx.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ComprehensionDailyQuotaBadge } from '@/components/shared/ComprehensionDailyQuotaBadge';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, Layers, Target, Shuffle, Play } from 'lucide-react';

type CeFormat = 'court' | 'trous' | 'multi_texte' | 'long_admin' | 'article_presse';

const FORMAT_LABELS: Record<CeFormat, string> = {
  court: 'Texte court',
  trous: 'Texte à trous',
  multi_texte: 'Textes multiples',
  long_admin: 'Document administratif',
  article_presse: 'Article de presse',
};
const ALL_FORMATS = Object.keys(FORMAT_LABELS) as CeFormat[];
const ALL = 'all';

interface CeScenario {
  id: string;
  format: CeFormat;
  level: string;
  title: string | null;
  texte: string | null;
}

export default function ComprehensionEcritePage() {
  const router = useRouter();
  const supabase = createClient();
  const [scenarios, setScenarios] = useState<CeScenario[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [format, setFormat] = useState<CeFormat | typeof ALL>(ALL);
  const [level, setLevel] = useState<string>(ALL);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(false);
      const [{ data: scenarioRows, error: scenarioError }, { data: questionRows }] = await Promise.all([
        supabase.from('ce_scenarios').select('id, format, level, title, texte').eq('is_active', true),
        supabase.from('ce_scenario_questions_public').select('scenario_id'),
      ]);
      if (!active) return;
      if (scenarioError || !scenarioRows) {
        setError(true);
        setLoading(false);
        return;
      }
      const counts: Record<string, number> = {};
      (questionRows || []).forEach((q: { scenario_id: string }) => {
        counts[q.scenario_id] = (counts[q.scenario_id] || 0) + 1;
      });
      setScenarios(scenarioRows as CeScenario[]);
      setQuestionCounts(counts);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [supabase]);

  const levels = useMemo(() => {
    const distinct = Array.from(new Set(scenarios.map((s) => s.level))).sort();
    return [ALL, ...distinct];
  }, [scenarios]);

  const filtered = scenarios.filter(
    (s) => (format === ALL || s.format === format) && (level === ALL || s.level === level)
  );

  const handleSurpriseMe = () => {
    if (filtered.length === 0) return;
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    router.push(`/tef-irn/comprehension-ecrite/${random.id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      <div className="mx-auto max-w-5xl p-4 md:p-10 lg:p-12">
        <div className="mb-8">
          <PageHeader
            badge="Coach CE"
            title="Coach de compréhension"
            highlight="écrite"
            description="Choisissez un format précis pour cibler ce qui vous pose le plus de difficulté, ou parcourez librement tous les sujets disponibles."
          >
            <ComprehensionDailyQuotaBadge skill="CE" />
          </PageHeader>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-zinc-300">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm font-medium text-red-400">
            Impossible de charger les sujets. Vérifiez votre connexion.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-start">
              <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 shadow-sm">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-indigo-600" /> Format
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat(ALL)}
                    className={`h-12 rounded-2xl font-black text-sm transition-all ${format === ALL ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
                  >
                    Tous
                  </button>
                  {ALL_FORMATS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`h-12 rounded-2xl font-black text-sm transition-all ${format === f ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
                    >
                      {FORMAT_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 shadow-sm">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-indigo-600" /> Niveau
                </div>
                <div className="flex gap-2">
                  {levels.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`flex-1 h-12 rounded-2xl font-black transition-all ${level === l ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
                    >
                      {l === ALL ? 'Tous' : l}
                    </button>
                  ))}
                </div>
              </div>

              <div
                onClick={handleSurpriseMe}
                className="bg-indigo-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-indigo-100 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                  <Shuffle size={14} /> Scénario surprise
                </div>
                <h4 className="text-base font-black leading-tight">Laissez-vous surprendre</h4>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                  <Play size={16} /> Tirage aléatoire
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Badge className="bg-indigo-600 rounded-full px-3 py-1 text-white border-none">
                  {format === ALL ? 'Tous les formats' : FORMAT_LABELS[format]}
                </Badge>
                <span className="text-zinc-400">•</span>
                <span className="capitalize text-zinc-500">Niveau {level === ALL ? 'Tous' : level}</span>
              </h2>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {filtered.length} sujet{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm font-medium text-zinc-400">
                Aucun sujet disponible pour ces filtres.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => (
                  <Card
                    key={s.id}
                    className="group cursor-pointer overflow-hidden rounded-[1.75rem] border-none bg-white shadow-lg shadow-zinc-200/50 transition-transform hover:-translate-y-1 hover:shadow-xl"
                    onClick={() => router.push(`/tef-irn/comprehension-ecrite/${s.id}`)}
                  >
                    <CardContent className="flex flex-col gap-3 p-6">
                      <div className="flex items-center gap-2">
                        <Badge className="rounded-full border-none bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                          {FORMAT_LABELS[s.format]}
                        </Badge>
                        <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          Niveau {s.level}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-black leading-tight tracking-tight text-zinc-900">
                        {s.title ?? FORMAT_LABELS[s.format]}
                      </h3>
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                        {questionCounts[s.id] ?? 0} question{(questionCounts[s.id] ?? 0) > 1 ? 's' : ''}
                      </p>
                      <p className="line-clamp-3 text-sm font-medium leading-relaxed text-zinc-500">
                        {s.texte ?? 'Plusieurs documents courts à comparer.'}
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 w-fit rounded-xl bg-zinc-900 font-black group-hover:bg-indigo-600"
                      >
                        <BookOpen className="mr-2" size={14} /> Commencer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
