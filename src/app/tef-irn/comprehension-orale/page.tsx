'use client';

// Catalogue de pratique Compréhension Orale, dissocié de l'Examen Blanc.
// Miroir exact de comprehension-ecrite/page.tsx (voir ses commentaires) --
// pas d'aperçu du contenu audio dans la card (transcription non affichée :
// ce serait un spoiler direct des réponses avant même d'écouter).

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ComprehensionDailyQuotaBadge } from '@/components/shared/ComprehensionDailyQuotaBadge';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Headset, Loader2, Layers, Target, Shuffle, Play } from 'lucide-react';

type CoFormat = 'annonce' | 'repondeur' | 'chronique' | 'micro_trottoir' | 'conversation';

const FORMAT_LABELS: Record<CoFormat, string> = {
  annonce: 'Annonce',
  repondeur: 'Répondeur',
  chronique: 'Chronique',
  micro_trottoir: 'Micro-trottoir',
  conversation: 'Conversation',
};
// conversation : valeur autorisée en base mais pas encore utilisée par le
// contenu migré (voir ExamContext) -- filtre affiché seulement s'il existe
// au moins un scenario de ce format, comme les autres.
const ALL = 'all';

interface CoScenario {
  id: string;
  format: CoFormat;
  level: string;
  title: string | null;
}

export default function ComprehensionOralePage() {
  const router = useRouter();
  const supabase = createClient();
  const [scenarios, setScenarios] = useState<CoScenario[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [format, setFormat] = useState<CoFormat | typeof ALL>(ALL);
  const [level, setLevel] = useState<string>(ALL);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(false);
      const [{ data: scenarioRows, error: scenarioError }, { data: questionRows }] = await Promise.all([
        supabase.from('co_scenarios').select('id, format, level, title').eq('is_active', true),
        supabase.from('co_scenario_questions_public').select('scenario_id'),
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
      setScenarios(scenarioRows as CoScenario[]);
      setQuestionCounts(counts);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [supabase, reloadKey]);

  const availableFormats = useMemo(
    () => Array.from(new Set(scenarios.map((s) => s.format))) as CoFormat[],
    [scenarios]
  );
  const levels = useMemo(() => {
    const distinct = Array.from(new Set(scenarios.map((s) => s.level)));
    return [ALL, ...distinct];
  }, [scenarios]);

  const filtered = scenarios.filter(
    (s) => (format === ALL || s.format === format) && (level === ALL || s.level === level)
  );

  const handleSurpriseMe = () => {
    if (filtered.length === 0) return;
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    router.push(`/tef-irn/comprehension-orale/${random.id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      <div className="mx-auto max-w-5xl p-4 md:p-10 lg:p-12">
        <div className="mb-8">
          <PageHeader
            badge="Coach CO"
            title="Coach de compréhension"
            highlight="orale"
            description="Choisissez un format précis pour cibler ce qui vous pose le plus de difficulté, ou parcourez librement tous les sujets disponibles."
          >
            <ComprehensionDailyQuotaBadge skill="CO" />
          </PageHeader>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-zinc-300">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-red-200 bg-red-50/50 p-6 text-center">
            <p className="text-sm font-medium text-red-600">
              Impossible de charger les sujets. Vérifiez votre connexion.
            </p>
            <Button variant="outline" className="h-11 rounded-2xl font-bold" onClick={() => setReloadKey((k) => k + 1)}>
              Réessayer
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-start">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 space-y-4 shadow-sm">
                <div className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-indigo-600" /> Format
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat(ALL)}
                    className={`h-12 rounded-2xl font-black text-sm transition-all ${format === ALL ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
                  >
                    Tous
                  </button>
                  {availableFormats.map((f) => (
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

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 space-y-4 shadow-sm">
                <div className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
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

              <button
                type="button"
                onClick={handleSurpriseMe}
                className="block w-full space-y-4 rounded-3xl bg-indigo-600 p-6 text-left text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-80">
                  <Shuffle size={14} aria-hidden /> Scénario surprise
                </span>
                <span className="block text-base font-black leading-tight">Laissez-vous surprendre</span>
                <span className="flex items-center gap-2 text-xs font-black uppercase">
                  <Play size={16} aria-hidden /> Tirage aléatoire
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Badge className="bg-indigo-600 rounded-full px-3 py-1 text-white border-none">
                  {format === ALL ? 'Tous les formats' : FORMAT_LABELS[format]}
                </Badge>
                <span className="text-zinc-400">•</span>
                <span className="capitalize text-zinc-500">Niveau {level === ALL ? 'Tous' : level}</span>
              </h2>
              <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                {filtered.length} sujet{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-zinc-200 p-6 text-center">
                <p className="text-sm font-medium text-zinc-500">
                  Aucun sujet disponible pour ces filtres.
                </p>
                {(format !== ALL || level !== ALL) && (
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl font-bold"
                    onClick={() => { setFormat(ALL); setLevel(ALL); }}
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => (
                  <Link
                    key={s.id}
                    href={`/tef-irn/comprehension-orale/${s.id}`}
                    className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  >
                  <Card className="h-full overflow-hidden rounded-3xl border-none bg-white shadow-lg shadow-zinc-200/50 transition-transform group-hover:-translate-y-1 group-hover:shadow-xl">
                    <CardContent className="flex flex-col gap-3 p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full border-none bg-indigo-600 px-3 py-1 text-xs font-black uppercase tracking-widest">
                          {FORMAT_LABELS[s.format]}
                        </Badge>
                        <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-600">
                          {s.level}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-black leading-tight tracking-tight text-zinc-900">
                        {s.title ?? FORMAT_LABELS[s.format]}
                      </h3>
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                        {questionCounts[s.id] ?? 0} question{(questionCounts[s.id] ?? 0) > 1 ? 's' : ''}
                      </p>
                      <p className="line-clamp-3 text-sm font-medium leading-relaxed text-zinc-500">
                        Écoutez l&apos;enregistrement puis répondez aux questions.
                      </p>
                      <span className="mt-2 inline-flex h-11 w-fit items-center rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white transition-colors group-hover:bg-indigo-700">
                        <Headset className="mr-2" size={14} aria-hidden /> Écouter
                      </span>
                    </CardContent>
                  </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
