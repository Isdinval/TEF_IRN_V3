import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  getParcoursById,
  getLessonsForParcours,
  getParcoursProgress,
  getUnlockedLessonIds,
  getTrulyCompletedLessonIds,
  getUnlockedExercisesCatalogue,
} from '@/lib/parcours';

// Alimente l'arbre leçons/exercices affiché inline dans /tef-irn/progression
// (item "inline complet" du plan) : même recette que le Server Component
// /tef-irn/parcours/[slug]/page.tsx, mais chargée à la demande via ce Route
// Handler plutôt qu'eagerly pour tous les parcours de tous les niveaux --
// jusqu'à 16 parcours (4 niveaux x 4 catégories) sur la page, la plupart
// jamais dépliés par l'utilisateur. Le clic reste sur la même page (pas de
// navigation), seule la donnée est chargée à la demande.
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const parcoursId = new URL(req.url).searchParams.get('parcoursId');
  if (!parcoursId) return NextResponse.json({ error: 'parcoursId manquant' }, { status: 400 });

  const parcours = await getParcoursById(parcoursId, supabase);
  if (!parcours) return NextResponse.json({ error: 'Parcours introuvable' }, { status: 404 });

  const { data: profileData } = await supabase
    .from('profiles')
    .select('learning_mode')
    .eq('id', user.id)
    .maybeSingle();
  const learningMode = (profileData?.learning_mode as 'academique' | 'libre') || 'libre';

  const allLessons = await getLessonsForParcours(parcours.level, parcours.category, supabase);
  const progress = await getParcoursProgress(user.id, parcours.level, parcours.category, parcours.id, supabase);

  const trulyCompletedLessonIds = await getTrulyCompletedLessonIds(
    user.id,
    allLessons,
    progress.completedLessons,
    learningMode,
    supabase
  );
  const unlockedLessonIds = getUnlockedLessonIds(allLessons, trulyCompletedLessonIds);

  const catalogueExercises = await getUnlockedExercisesCatalogue(
    parcours.level,
    parcours.category,
    unlockedLessonIds,
    user.id,
    supabase
  );

  const lessonMeta: Record<string, { title: string; order_index: number }> = {};
  allLessons.forEach((lesson) => {
    lessonMeta[lesson.id] = { title: lesson.title, order_index: lesson.order_index };
  });

  return NextResponse.json({ catalogueExercises, lessonMeta });
}
