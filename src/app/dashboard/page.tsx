"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, Zap, Calendar, ArrowRight } from "lucide-react";
import { GamificationStats } from "@/components/features/dashboard/GamificationStats";
import { CompetencyRadar } from "@/components/features/dashboard/CompetencyRadar";
import { LeagueStats } from "@/components/features/dashboard/LeagueStats";
import { RecentCorrections } from "@/components/features/dashboard/RecentCorrections";
import { DailyObjective } from "@/components/features/dashboard/DailyObjective";
import { VocabProgress } from "@/components/features/dashboard/VocabProgress";
import { Profile, Recommendation } from "@/types/database";
import { PageTransition, FadeIn } from "@/components/shared/Animations";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recentCorrections, setRecentCorrections] = useState<any[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [xpToday, setXpToday] = useState(0);
  const [competencyData, setCompetencyData] = useState<any[]>([]);
  const [vocabStats, setVocabStats] = useState<any>({ total: 0, topLevel: 'A1', levels: {} });
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
      <div className="bg-zinc-50/50 min-h-full">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Main Content (Left & Center) */}
            <div className="lg:col-span-8 space-y-10">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">
                    <TrendingUp size={14} /> Tableau de Bord
                  </div>
                  <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
                    Bonjour, {profile?.full_name?.split(' ')[0] || 'Apprenti'} !
                  </h1>
                  <p className="text-zinc-500 font-medium italic">Visez l'excellence, un mot après l'autre.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200 shadow-sm" />
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                    +1,2k élèves <br />en ligne
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DailyObjective xpToday={xpToday} goal={dailyGoal} />

                <Card className="border-none shadow-xl shadow-zinc-100 bg-white overflow-hidden group cursor-pointer" onClick={() => router.push('/practice')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-widest mb-1">
                      <Zap size={12} fill="currentColor" /> Session de Révision
                    </div>
                    <CardTitle className="text-xl font-black text-zinc-900">À ne pas oublier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-500 mb-4 font-medium italic">
                      Vous avez {reviewsCount} notions prêtes pour un rafraîchissement.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-orange-100" />)}
                      </div>
                      <ArrowRight size={20} className="text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <RecentCorrections corrections={recentCorrections} />

              <div className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 px-1">Conseils de l'IA Coach</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.length > 0 ? recommendations.map((reco, i) => (
                    <Card key={reco.id} className="border-zinc-100 hover:border-indigo-200 hover:shadow-lg transition-all group shadow-sm bg-white">
                      <CardContent className="p-5 flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Sparkles size={18} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-zinc-900 leading-tight">
                            {reco.type === 'lesson' ? 'Maîtriser une nouvelle leçon' : 'Renforcer vos acquis'}
                          </h3>
                          <p className="text-xs text-zinc-500 leading-relaxed font-medium italic">
                            {reco.reason}
                          </p>
                          <button
                            onClick={() => router.push(reco.type === 'lesson' ? `/lessons/${reco.reference_id}` : '/practice')}
                            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all"
                          >
                            Commencer <ArrowRight size={10} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <Card className="border-zinc-100 bg-zinc-50/50 col-span-2 border-dashed">
                      <CardContent className="p-8 text-center space-y-2">
                        <Calendar className="mx-auto text-zinc-300" size={32} />
                        <p className="text-sm font-bold text-zinc-400">Réalisez un exercice pour débloquer vos conseils personnalisés.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="border-none shadow-2xl shadow-zinc-200/50 bg-white rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 space-y-8">
                  <CompetencyRadar data={competencyData} />

                  <div className="h-px bg-zinc-100 w-full" />

                  <VocabProgress stats={vocabStats} />

                  <div className="h-px bg-zinc-100 w-full" />

                  <LeagueStats xp={xp} />

                  <div className="h-px bg-zinc-100 w-full" />

                  <GamificationStats profile={profile} />
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
