"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Loader2, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { GamificationStats } from "@/components/features/dashboard/GamificationStats";
import Link from "next/link";
import { getParcours, getParcoursProgress, Parcours, ParcoursProgress } from "@/lib/parcours";
import { CompetencyRadar } from "@/components/features/dashboard/CompetencyRadar";
import { LeagueStats } from "@/components/features/dashboard/LeagueStats";
import { RecentCorrections } from "@/components/features/dashboard/RecentCorrections";
import { DailyObjective } from "@/components/features/dashboard/DailyObjective";
import { VocabProgress } from "@/components/features/dashboard/VocabProgress";
import { Profile, Recommendation } from "@/types/database";
import { PageTransition } from "@/components/shared/Animations";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recentCorrections, setRecentCorrections] = useState<any[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [xpToday, setXpToday] = useState(0);
  const [competencyData, setCompetencyData] = useState<any[]>([]);
  const [vocabStats, setVocabStats] = useState<any>({ total: 0, topLevel: 'A1', levels: {} });
  const [inProgressParcours, setInProgressParcours] = useState<(Parcours & { progress: ParcoursProgress })[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        setLoading(false);
        return;
      }
      if (user) {
        // 1. Charger le profil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) setProfile(profileData);

        // 2. Charger les recommandations
        const { data: recoData } = await supabase
          .from('recommendations')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .limit(2);

        if (recoData) setRecommendations(recoData);

        // 3. Charger les corrections récentes
        const { data: correctionsData } = await supabase
          .from('exercise_attempts')
          .select(`
            id,
            created_at,
            score,
            exercises (instructions, type),
            ai_feedback (overall_score, global_comment)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (correctionsData) setRecentCorrections(correctionsData);

        // 4. Charger le nombre de révisions dues
        const { count: reviewsCountExo } = await supabase
          .from('user_reviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lte('next_review_at', new Date().toISOString());

        const { count: reviewsCountVocab } = await supabase
          .from('user_vocabulary_reviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lte('next_review_at', new Date().toISOString());

        setReviewsCount((reviewsCountExo || 0) + (reviewsCountVocab || 0));

        // 5. Calculer l'XP du jour
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: todayAttempts } = await supabase
          .from('exercise_attempts')
          .select('score')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        const totalXpToday = todayAttempts?.reduce(((sum: number, attempt: any) => sum + (attempt.score || 0)), 0) || 0;
        setXpToday(Math.round(totalXpToday));

        // 6. Agréger les données de compétence pour le Radar
        const { data: allAttempts } = await supabase
          .from('exercise_attempts')
          .select(`
            score,
            exercises (type)
          `)
          .eq('user_id', user.id)
          .not('score', 'is', null);

        if (allAttempts && allAttempts.length > 0) {
          const categoriesMap: Record<string, { sum: number, count: number, label: string }> = {
            'qcm': { sum: 0, count: 0, label: 'GRAMMAIRE' },
            'ecrit': { sum: 0, count: 0, label: 'RÉDACTION' },
            'trous': { sum: 0, count: 0, label: 'ÉCRIT' },
            'oral': { sum: 0, count: 0, label: 'ORAL' },
            'reformulage': { sum: 0, count: 0, label: 'PARLER' }
          };

          allAttempts.forEach((attempt: any) => {
            const type = attempt.exercises?.type;
            if (type && categoriesMap[type]) {
              categoriesMap[type].sum += attempt.score || 0;
              categoriesMap[type].count += 1;
            }
          });

          const radarData = Object.values(categoriesMap).map(cat => ({
            subject: cat.label,
            A: cat.count > 0 ? Math.round(cat.sum / cat.count) : 0,
            fullMark: 100
          }));
          setCompetencyData(radarData);
        }

        // 7. Charger les stats de vocabulaire
        const { data: vocabReviews } = await supabase
          .from('user_vocabulary_reviews')
          .select(`
            id,
            vocabulary (level)
          `)
          .eq('user_id', user.id)
          .gt('consecutive_correct', 0);

        if (vocabReviews) {
          const stats = {
            total: vocabReviews.length,
            levels: { 'A1': 0, 'A2': 0, 'B1': 0, 'B2': 0 },
            topLevel: 'A1'
          };
          vocabReviews.forEach((r: any) => {
             const lvl = r.vocabulary?.level;
             if (lvl && stats.levels[lvl as keyof typeof stats.levels] !== undefined) {
               stats.levels[lvl as keyof typeof stats.levels]++;
             }
          });
          if (stats.levels['B2'] > 0) stats.topLevel = 'B2';
          else if (stats.levels['B1'] > 0) stats.topLevel = 'B1';
          else if (stats.levels['A2'] > 0) stats.topLevel = 'A2';

          setVocabStats(stats);
        }
      }

        // 8. Charger les parcours en cours
        const allParcours = await getParcours();
        const progressPromises = allParcours.map(async (p) => {
          const prog = await getParcoursProgress(user.id, p.level, p.category);
          return { ...p, progress: prog };
        });
        const parcoursWithProgress = await Promise.all(progressPromises);
        const inProgress = parcoursWithProgress.filter(p => p.progress.percent > 0 && p.progress.percent < 100);
        setInProgressParcours(inProgress);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const xp = profile?.total_xp || 0;
  const level = profile?.current_level || "A1";
  const dailyGoal = 100;

  return (
    <PageTransition>
      <div className="min-h-full bg-zinc-50/50 selection:bg-indigo-100">
        <div className="mx-auto max-w-[1400px] p-6 pt-10 lg:p-10">
          <header className="mb-12">
            <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
              Tableau de bord
            </Badge>
            <h1 className="mb-4 text-5xl font-black tracking-tighter text-zinc-900">
              BONJOUR, <span className="text-indigo-600">{profile?.full_name?.split(' ')[0] || 'APPRENTI'}</span>
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500">
              Votre cockpit TEF IRN : objectifs du jour, corrections récentes, vocabulaire et recommandations IA au même endroit.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <DailyObjective xpToday={xpToday} goal={dailyGoal} />

                <Card
                  className="group cursor-pointer overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-100"
                  onClick={() => router.push('/practice')}
                >
                  <CardHeader className="pb-2">
                    <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500">
                      <Zap size={12} fill="currentColor" /> Session de révision
                    </div>
                    <CardTitle className="text-xl font-black text-zinc-900">À ne pas oublier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-6 text-sm font-medium italic leading-relaxed text-zinc-500">
                      Vous avez {reviewsCount} notion{reviewsCount > 1 ? 's' : ''} prête{reviewsCount > 1 ? 's' : ''} pour un rafraîchissement.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((dot) => (
                          <div key={dot} className="h-2 w-2 rounded-full bg-orange-100" />
                        ))}
                      </div>
                      <ArrowRight size={20} className="text-zinc-300 transition-all group-hover:translate-x-1 group-hover:text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <RecentCorrections corrections={recentCorrections} />

              {/* Parcours en cours Section */}
              {inProgressParcours.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-zinc-900">
                      <Badge className="rounded-full bg-violet-600 px-3 py-1">En cours</Badge>
                      <span className="text-zinc-400">•</span>
                      Mes parcours
                    </h2>
                    <Link href="/parcours" className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline">
                      Tout voir
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {inProgressParcours.map((p) => (
                      <Card key={p.id} className="group overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50 transition-all hover:-translate-y-1">
                        <CardContent className="p-8">
                          <div className="mb-6 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{p.level} • {p.category}</p>
                              <h3 className="text-xl font-black text-zinc-900 capitalize">{p.category} {p.level}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
                              <Target size={24} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-zinc-500">
                              <span>Progression</span>
                              <span>{p.progress.completed}/{p.progress.total} leçons</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className="h-full bg-violet-600 transition-all duration-1000"
                                style={{ width: `${p.progress.percent}%` }}
                              />
                            </div>
                          </div>

                          <Button
                            onClick={() => router.push(`/parcours/${p.id}`)}
                            className="mt-6 w-full h-12 rounded-2xl bg-zinc-900 font-black text-sm text-white hover:bg-black transition-all"
                          >
                            Continuer
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                  <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-zinc-900">
                    <Badge className="rounded-full bg-indigo-600 px-3 py-1">Coach IA</Badge>
                    <span className="text-zinc-400">•</span>
                    Conseils personnalisés
                  </h2>
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    {recommendations.length || 0} recommandation{recommendations.length > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {recommendations.length > 0 ? recommendations.map((reco) => (
                    <Card key={reco.id} className="group rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-100 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100">
                      <CardContent className="flex gap-4 p-6">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                          <Sparkles size={20} />
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-black leading-tight text-zinc-900">
                            {reco.type === 'lesson' ? 'Maîtriser une nouvelle leçon' : 'Renforcer vos acquis'}
                          </h3>
                          <p className="text-xs font-medium italic leading-relaxed text-zinc-500">
                            {reco.reason}
                          </p>
                          <button
                            onClick={() => router.push(reco.type === 'lesson' ? `/lessons/${reco.reference_id}` : '/practice')}
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 transition-all hover:gap-2"
                          >
                            Commencer <ArrowRight size={10} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <Card className="col-span-1 rounded-[2rem] border-2 border-dashed border-zinc-100 bg-white shadow-xl shadow-zinc-100 md:col-span-2">
                      <CardContent className="space-y-3 p-10 text-center">
                        <Calendar className="mx-auto text-zinc-300" size={34} />
                        <p className="text-sm font-bold text-zinc-400">
                          Réalisez un exercice pour débloquer vos conseils personnalisés.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6 lg:col-span-4">
              <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-2xl shadow-zinc-200/50">
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Target size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900">Progression</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Niveau {level} • {xp} XP</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <CompetencyRadar data={competencyData} />
                  <div className="h-px w-full bg-zinc-100" />
                  <VocabProgress stats={vocabStats} />
                  <div className="h-px w-full bg-zinc-100" />
                  <LeagueStats xp={xp} />
                  <div className="h-px w-full bg-zinc-100" />
                  <GamificationStats profile={profile} />
                </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none bg-zinc-50 p-8 shadow-xl shadow-zinc-100">
                <div className="mb-4 flex items-center gap-3">
                  <TrendingUp className="text-zinc-400" size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Guide rapide</h3>
                </div>
                <p className="text-xs font-medium italic leading-relaxed text-zinc-500">
                  Commencez par l'objectif quotidien, révisez les notions dues, puis consultez vos corrections pour transformer vos erreurs en automatismes.
                </p>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
