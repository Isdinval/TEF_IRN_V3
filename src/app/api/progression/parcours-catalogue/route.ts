import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  getParcoursById,
  getLessonsForParcours,
  getParcoursProgress,
  getUnlockedLessonIds,
  getTrulyCompletedLessonIds,
  getLessonQuotaExercises,
  getExerciseUrl,
} from '@/lib/parcours';

/**
 * Alimente la liste inline (leçons + exercices) affichée sous chaque
 * parcours de /tef-irn/progression.
 *
 * Retour Olivier après tests manuels, 2 corrections par rapport à la
 * première version :
 * - Renvoie DÉSORMAIS TOUTES les leçons du parcours (pas seulement celles
 *   débloquées) -- l'utilisateur doit voir tout le chemin ("0/6 leçons
 *   terminées" mais une seule leçon visible n'avait pas de sens). Seules
 *   les leçons débloquées ont leurs exercices renseignés ; les autres sont
 *   marquées `unlocked: false` avec un tableau d'exercices vide.
 * - Forme de réponse aplatie par leçon (au lieu d'un pool CatalogueExercise
 *   + lessonMeta pensé pour ParcoursExerciseTreeCatalogue) : chaque exercice
 *   n'a plus besoin d'afficher notion/catégorie/thématique sur cette page,
 *   seulement sa position ("Exercice QCM 2") -- le tri qcm-avant-trous est
 *   fait ici, le composant client n'a plus qu'à numéroter dans l'ordre.
 */
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
  const completedSet = new Set(trulyCompletedLessonIds);

  const lessons = await Promise.all(
    allLessons.map(async (lesson) => {
      const isUnlocked = unlockedLessonIds.has(lesson.id);
      const exercises = isUnlocked ? await getLessonQuotaExercises(user.id, lesson.id, supabase) : [];
      return {
        id: lesson.id,
        title: lesson.title,
        orderIndex: lesson.order_index,
        isCompleted: completedSet.has(lesson.id),
        unlocked: isUnlocked,
        exercises: exercises.map((ex) => ({
          id: ex.id,
          type: ex.type,
          isCompleted: !!ex.is_completed,
          url: getExerciseUrl(ex, parcours.id),
        })),
      };
    })
  );

  return NextResponse.json({ lessons });
}
