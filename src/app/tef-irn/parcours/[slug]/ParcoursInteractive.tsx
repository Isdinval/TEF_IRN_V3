"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCoachContext } from "@/contexts/CoachContext";
import { Parcours, Lesson, Exercise, ParcoursProgress, getExerciseUrl } from "@/lib/parcours";
import { User } from "@supabase/supabase-js";
import {
  Trophy,
  Target,
  Sparkles,
  BookText,
  ArrowRight,
  Clock,
  TrendingUp,
  ChevronRight,
  Lock,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion } from "framer-motion";
import LessonCard from "./components/LessonCard";
import ExerciseCard from "./components/ExerciseCard";
import ParcoursExerciseTreeCatalogue, { CatalogueExercise } from "./components/ParcoursExerciseTreeCatalogue";
import VocabThemeCard from "./components/VocabThemeCard";
import { ParcoursBreadcrumb } from "@/components/shared/ParcoursBreadcrumb";

interface ParcoursInteractiveProps {
  parcours: Parcours;
  allLessons: Lesson[];
  initialProgress: ParcoursProgress | null;
  initialRecommendedExercises: Exercise[];
  /** Catalogue complet (pas juste le top recommandé) des exercices rattachés
   *  aux leçons débloquées -- item #6 du plan "Verrouillage exercices
   *  topbar/parcours", alimente l'accordéon sous le hero. */
  catalogueExercises: CatalogueExercise[];
  /** Titre + order_index de chaque leçon du parcours, indexé par lesson_id --
   *  même format que GrammarCheckTreeCatalogue/PracticeTreeCatalogue. */
  lessonMeta: Record<string, { title: string; order_index: number }>;
  initialGuideSlug: string | null;
  user: User | null;
  /** Bloc A (profiles.learning_mode). Conditionne le verrou visuel des
   *  leçons ci-dessous -- 'libre' garde le comportement actuel (aucun
   *  verrou), 'academique' active status='locked' au-delà de la leçon
   *  "next". */
  learningMode: 'academique' | 'libre';
  /** Fix bug critique (item 4-D) : leçons "vraiment" complétées pour le
   *  déverrouillage (lesson_progress + quota d'exercices en académique, cf.
   *  getTrulyCompletedLessonIds dans lib/parcours.ts) -- distinct de
   *  initialProgress.completedLessons (lesson_progress brut), qui reste la
   *  source de la barre de progression "X/Y leçons". */
  trulyCompletedLessonIds: string[];
}

export default function ParcoursInteractive({
  parcours,
  allLessons,
  initialProgress,
  initialRecommendedExercises,
  catalogueExercises,
  lessonMeta,
  initialGuideSlug,
  user,
  learningMode,
  trulyCompletedLessonIds
}: ParcoursInteractiveProps) {
  const [progress] = useState(initialProgress);
  const [recommendedExercises] = useState(initialRecommendedExercises);
  const searchParams = useSearchParams();
  const [lockedBannerDismissed, setLockedBannerDismissed] = useState(false);
  const showLockedBanner = searchParams?.get("locked") === "1" && !lockedBannerDismissed;
  const { setPageContext } = useCoachContext();

  useEffect(() => {
    const next = recommendedExercises[0];
    const nextLesson = next?.lesson_id ? allLessons.find((l) => l.id === next.lesson_id) : undefined;
    setPageContext({
      type: "parcours",
      category: parcours.category,
      level: parcours.level,
      slug: parcours.slug,
      nomParcours: parcours.nom_parcours ?? undefined,
      objective: parcours.objective,
      progress: progress
        ? { completed: progress.completed, total: progress.total, percent: progress.percent }
        : undefined,
      nextExercise: next
        ? {
            id: next.id,
            type: next.type,
            category: next.category,
            level: next.level,
            instructions: next.instructions,
            lessonId: next.lesson_id ?? undefined,
            lessonTitle: nextLesson?.title,
            lessonSlug: nextLesson?.slug,
          }
        : null,
    });
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcours.id, progress, recommendedExercises, allLessons]);

  const lessonsWithStatus = useMemo(() => {
    if (!user || !progress) return allLessons.map(l => ({ ...l, status: 'open' as const }));

    let nextFound = false;
    return allLessons.map((lesson) => {
      const isCompleted = trulyCompletedLessonIds.includes(lesson.id);
      let status: 'completed' | 'next' | 'locked' | 'open' = 'open';

      if (isCompleted) {
        status = 'completed';
      } else if (!nextFound) {
        status = 'next';
        nextFound = true;
      } else if (learningMode === 'academique') {
        status = 'locked';
      }

      return { ...lesson, status };
    });
  }, [allLessons, progress, user, learningMode, trulyCompletedLessonIds]);

  // Leçon "en cours" pour la carte vocab thématique -- même critère que
  // status='next' ci-dessus (première leçon non complétée), mais dérivé
  // séparément pour ne pas dépendre du calcul complet de lessonsWithStatus.
  const currentVocabLesson = useMemo(() => {
    if (parcours.category !== 'vocabulaire') return null;
    return lessonsWithStatus.find((l) => l.status === 'next') ?? null;
  }, [parcours.category, lessonsWithStatus]);

  return (
    <article className="min-h-screen bg-zinc-50/50 pb-24">
      <div className="bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <ParcoursBreadcrumb />
      </div>

      {showLockedBanner && (
        <div className="mx-auto max-w-5xl px-4 pt-4 md:px-10 lg:px-12">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-3.5">
            <Lock size={18} className="shrink-0" />
            <p className="flex-1 text-sm font-bold">
              Cette leçon n'est pas encore débloquée — terminez d'abord les précédentes.
            </p>
            <button
              onClick={() => setLockedBannerDismissed(true)}
              aria-label="Fermer"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 pt-4 md:px-10 md:pt-10 lg:px-12 lg:pt-12">
        <PageHeader
          badge={`${parcours.level} · Parcours ${parcours.category}`}
          title={parcours.nom_parcours || `${parcours.category} ${parcours.level}`}
          description={parcours.objective || undefined}
          aside={
            user ? (
              <div className="w-full shrink-0 space-y-4 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm md:w-auto">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Prêt pour la suite ?</p>
                  <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900">Continuez !</h3>
                </div>
                <Link
                  href={`/tef-irn/lessons/${lessonsWithStatus.find(l => l.status === 'next')?.slug || lessonsWithStatus[0].slug}?parcoursId=${parcours.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-indigo-600 px-8 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
                >
                  Démarrer la leçon <ArrowRight className="ml-2" size={18} aria-hidden />
                </Link>
              </div>
            ) : (
              <Link
                href="/tef-irn/login"
                className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-full bg-indigo-600 px-8 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 md:w-auto"
              >
                Essai Gratuit
              </Link>
            )
          }
        />
      </div>

      <div className="mx-auto mt-8 max-w-5xl px-4 md:px-10 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="md:col-span-2 rounded-3xl bg-white p-6 md:p-10 shadow-sm border border-zinc-100 relative overflow-hidden">
            {user ? (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Votre Progression</span>
                    <motion.div
                      key={progress?.percent}
                      initial={{ opacity: 0.5, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-2xl font-black text-indigo-600 tracking-tight"
                    >
                      {progress?.percent}%
                    </motion.div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                      {progress?.completed} / {progress?.total}
                    </p>
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Leçons terminées</p>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100">
                  <motion.div
                    className="h-full bg-indigo-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress?.percent}%` }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Target size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Suivez votre progression</h3>
                  <p className="text-zinc-500 font-medium max-w-sm">Connectez-vous pour enregistrer votre avancée et accéder aux exercices personnalisés.</p>
                </div>
                <Link href="/tef-irn/login">
                  <Button className="h-12 rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-sm">
                    Se connecter
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="rounded-3xl border-none bg-indigo-600 p-6 md:p-10 shadow-lg shadow-indigo-100 flex flex-col justify-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3 opacity-80">
                <Target size={24} />
                <span className="text-xs font-black uppercase tracking-widest">Niveau Visé</span>
              </div>
              <div className="text-3xl font-black tracking-tight mb-2">{parcours.level}</div>
              <p className="text-sm font-bold opacity-70 leading-tight">
                Maîtrisez les concepts essentiels du {parcours.category}
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10">
              <Sparkles size={200} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-20">
          <section className="space-y-10">
            <div className="flex items-center justify-between px-4">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                  Programme d'études
                </h2>
                <p className="text-zinc-500 font-medium">Suivez l'ordre recommandé pour une progression optimale.</p>
              </div>
              <Badge variant="secondary" className="rounded-full font-black text-xs px-5 py-1.5 bg-zinc-100 text-zinc-600 border-none">
                {allLessons.length} LEÇONS AU TOTAL
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {lessonsWithStatus.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson as any}
                  index={index}
                  isNext={lesson.status === 'next'}
                  category={parcours.category}
                  parcoursId={parcours.id}
                />
              ))}
            </div>
          </section>

          {user && currentVocabLesson && currentVocabLesson.vocab_theme_categories && currentVocabLesson.vocab_theme_categories.length > 0 && (
            <section className="space-y-6">
              <div className="px-4 space-y-1">
                <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                  Vocabulaire à réviser
                </h2>
                <p className="text-zinc-500 font-medium">Le lexique de votre leçon en cours, à consolider dans le module de révision.</p>
              </div>
              {/* Toujours grid-cols-2 (pas conditionné au nombre de thèmes) : une
                  carte seule garde la même largeur de cellule qu'à 2 cartes,
                  plutôt que de s'étirer sur toute la largeur du conteneur. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentVocabLesson.vocab_theme_categories.map((theme) => (
                  <VocabThemeCard
                    key={theme}
                    lessonId={currentVocabLesson.id}
                    theme={theme}
                    level={parcours.level}
                  />
                ))}
              </div>
            </section>
          )}

          {user && (
            <section className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Sparkles size={24} />
                    </div>
                    <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                      Entraînement Recommandé
                    </h2>
                  </div>
                  <p className="text-zinc-500 font-medium max-w-xl">
                    Des exercices personnalisés basés sur votre parcours et vos performances récentes.
                  </p>
                </div>
              </div>

              {recommendedExercises.length > 0 ? (
                <div className="space-y-8">
                  {/* 1er exercice en "hero" : seul variant qui affiche
                      recommendation_reason (cf. ExerciseCard.tsx), pour que
                      l'utilisateur voie pourquoi CET exercice est proposé en
                      premier (SRS dû, leçon en cours, point faible...) --
                      même pattern que /lessons/[slug]/complete. */}
                  <ExerciseCard exercise={recommendedExercises[0]} parcoursId={parcours.id} variant="hero" />

                  {/* Catalogue complet en accordéon (item #6, remplace l'ancienne
                      grille de 5 ExerciseCard limitée au top recommandé) -- même
                      système que les pages /grammar-check et /practice, adapté
                      pour mélanger qcm et trous sous une même leçon (voir
                      ParcoursExerciseTreeCatalogue.tsx). Scope déjà restreint aux
                      leçons débloquées côté page.tsx (getUnlockedExercisesCatalogue),
                      donc aucun exercice de leçon non atteinte n'y apparaît jamais. */}
                  {catalogueExercises.length > 1 && (
                    <ParcoursExerciseTreeCatalogue
                      exercises={catalogueExercises.filter((ex) => ex.id !== recommendedExercises[0].id)}
                      lessonMeta={lessonMeta}
                      getUrl={(ex) => getExerciseUrl(ex, parcours.id)}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-10 md:p-20 text-center space-y-6 border-2 border-dashed border-zinc-200">
                  <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4">
                    <BookText size={48} className="text-zinc-200" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Pas encore de recommandations</h3>
                     <p className="text-sm font-medium text-zinc-500 max-w-md mx-auto">
                      Terminez quelques leçons pour que notre IA puisse vous proposer des exercices adaptés !
                     </p>
                  </div>
                </div>
              )}
            </section>
          )}

          <section>
            <Card className="rounded-3xl border-none bg-zinc-900 p-8 md:p-14 text-white overflow-hidden relative group">
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-8">
                  <Badge className="bg-white/10 text-white border-white/20 rounded-full px-6 py-2 text-xs font-black uppercase tracking-widest">
                    Ressource d'Expert
                  </Badge>
                  <div className="space-y-4">
                    <h3 className="font-black text-2xl md:text-3xl leading-tight tracking-tight">
                      Besoin <br />
                      <span className="text-indigo-400">d'aide ?</span>
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-lg font-medium">
                      Accédez à notre guide complet sur la <span className="text-white underline decoration-indigo-500 underline-offset-4 capitalize">{parcours.category} {parcours.level}</span> pour maîtriser toutes les subtilités de l'examen.
                    </p>
                  </div>
                  <Link href={initialGuideSlug ? `/tef-irn/guides/${initialGuideSlug}` : "/tef-irn/guides"} className="block w-fit">
                    <Button variant="outline" className="h-12 px-8 bg-white/10 border-zinc-700 text-white hover:bg-white hover:text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-sm transition-all group">
                      {initialGuideSlug ? "Voir le guide complet" : "Parcourir les guides"}
                      <ArrowRight className="ml-2 transition-transform group-hover:translate-x-2" size={18} />
                    </Button>
                  </Link>
                </div>
                <div className="hidden lg:flex justify-center relative">
                    <div className="w-80 h-80 rounded-3xl bg-indigo-600 flex items-center justify-center rotate-6 shadow-lg relative z-10 group-hover:rotate-3 transition-transform duration-500">
                      <BookText size={140} className="-rotate-6 group-hover:-rotate-3 transition-transform duration-500" />
                    </div>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </article>
  );
}
