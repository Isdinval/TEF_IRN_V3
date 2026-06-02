"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, BookOpen, PenTool, CheckCircle2, Loader2 } from "lucide-react";
import { GamificationStats } from "@/components/features/dashboard/GamificationStats";
import { Profile, Recommendation } from "@/types/database";
import { PageTransition, FadeIn } from "@/components/shared/Animations";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
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
        // Charger le profil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) setProfile(profileData);

        // Charger les recommandations
        const { data: recoData } = await supabase
          .from('recommendations')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .limit(1);

        if (recoData) setRecommendations(recoData);

        // Charger le nombre de révisions dues
        const { count } = await supabase
          .from('user_reviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lte('next_review_at', new Date().toISOString());

        setReviewsCount(count || 0);
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

  const streak = profile?.streak_count || 0;
  const xp = profile?.total_xp || 0;
  const level = profile?.current_level || "A1";
  const xpConfig = {
    A1: { next: 1000, color: "bg-emerald-500" },
    A2: { next: 2500, color: "bg-blue-500" },
    B1: { next: 5000, color: "bg-indigo-500" },
    B2: { next: 10000, color: "bg-purple-500" },
  };
  const currentXpLimit = xpConfig[level as keyof typeof xpConfig]?.next || 2000;

  return (
    <PageTransition>
    <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonjour{profile?.full_name ? `, ${profile.full_name}` : ''} !</h1>
          <p className="text-muted-foreground">Prêt pour tes exercices du jour ?</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="px-3 py-1 flex gap-2 items-center text-orange-600 border-orange-200 bg-orange-50">
            <Flame size={16} fill="currentColor" /> {streak} jours
          </Badge>
          <Badge variant="outline" className="px-3 py-1 flex gap-2 items-center text-indigo-600 border-indigo-200 bg-indigo-50">
            <Target size={16} /> Niveau {level}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {reviewsCount > 0 && (
            <Card className="bg-indigo-600 text-white border-none overflow-hidden relative">
              <div className="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-4 -translate-y-4">
                <Flame size={120} fill="currentColor" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame size={20} /> Révisions prioritaires
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Tu as {reviewsCount} notion{reviewsCount > 1 ? 's' : ''} à réviser aujourd'hui pour ne pas oublier.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => router.push('/practice')}>
                  Lancer la session de révision
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-500" /> Recommandation du Coach
            </CardTitle>
            <CardDescription>Basé sur tes dernières performances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.length > 0 ? (
              <div className="p-4 border rounded-lg bg-indigo-50/50 border-indigo-100">
                <h3 className="font-semibold text-indigo-900">{recommendations[0].type === 'lesson' ? 'Leçon suggérée' : 'Exercice suggéré'}</h3>
                <p className="text-sm text-indigo-700 mt-1">{recommendations[0].reason}</p>
                <Button
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => router.push('/practice')}
                >
                  Continuer
                </Button>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-slate-50 border-slate-100 italic text-muted-foreground text-sm">
                Réalise un premier exercice pour recevoir des conseils personnalisés.
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progression XP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-indigo-600">Palier {level}</span>
                  <span className="text-slate-400">{xp} / {currentXpLimit} XP</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((xp / currentXpLimit) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${xpConfig[level as keyof typeof xpConfig]?.color || 'bg-indigo-600'}`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic text-center">
                  Plus que {Math.max(currentXpLimit - xp, 0)} XP avant le niveau suivant
                </p>
              </div>
            </CardContent>
          </Card>

          <GamificationStats profile={profile} />
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4">Activités Rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "QCM Express", icon: Target, desc: "5 min - Grammaire", href: "/practice" },
            { title: "Entraînement Écrit", icon: PenTool, desc: "20 min - Section B", href: "/writing" },
            { title: "Vocabulaire", icon: BookOpen, desc: "10 min - Administration", href: "/practice" },
            { title: "Examen Blanc", icon: CheckCircle2, desc: "1h30 - Complet", href: "/exam" },
          ].map((item, i) => (
            <Card key={i} className="hover:border-indigo-300 transition-colors cursor-pointer group" onClick={() => router.push(item.href)}>
              <CardContent className="pt-6">
                <item.icon className="mb-2 text-muted-foreground group-hover:text-indigo-600 transition-colors" size={24} />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
    </PageTransition>
  );
}
