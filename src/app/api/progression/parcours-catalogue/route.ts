import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  getParcoursById,
  getLessonsForParcours,
  getParcoursProgress,
  getUnlockedLessonIds,
  getTrulyCompletedLessonIds,
  getLessonQuotaExercises,
} from '@/lib/parcours';

// Alimente l'arbre leçons/exercices affiché inline dans /tef-irn/progression :
// même recette que le Server Component /tef-irn/parcours/[slug]/page.tsx pour
// les leçons débloquées, mais avec getLessonQuotaExercises() (3 QCM + 3 Trous
// PAR LEÇON, plafonné) au lieu de getUnlockedExercisesCatalogue() (tout le
// pool) -- retour Olivier après tests manuels : le catalogue complet faisait
// remonter des leçons à 12/15/20 exercices, incohérent avec le quota 3+3
// réellement exigé partout ailleurs et visuellement écrasant. Chargée à la
// demande via ce Route Handler plutôt qu'eagerly pour tous les parcours de
// tous les niveaux -- jusqu'à 16 parcours (4 niveaux x 4 catégories) sur la
// page, la plupart jamais dépliés par l'utilisateur.
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
  const unlockedLessons = allLessons.filter((lesson) => unlockedLessonIds.has(lesson.id));

  const catalogueExercisesPerLesson = await Promise.all(
    unlockedLessons.map((lesson) => getLessonQuotaExercises(user.id, lesson.id, supabase))
  );
  const catalogueExercises = catalogueExercisesPerLesson.flat();

  const lessonMeta: Record<string, { title: string; order_index: number }> = {};
  allLessons.forEach((lesson) => {
    lessonMeta[lesson.id] = { title: lesson.title, order_index: lesson.order_index };
  });

  return NextResponse.json({ catalogueExercises, lessonMeta });
}
