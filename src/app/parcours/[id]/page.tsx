import { createClient } from "@/lib/supabase-server";
import {
  getParcoursById,
  getLessonsForParcours,
  getParcoursProgress,
  getRecommendedExercises,
  Exercise
} from "@/lib/parcours";
import { notFound } from "next/navigation";
import ParcoursInteractive from "./ParcoursInteractive";

export default async function ParcoursDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const parcours = await getParcoursById(id, supabase);
  if (!parcours) {
    notFound();
  }

  const allLessons = await getLessonsForParcours(parcours.level, parcours.category, supabase);

  // Fetch user session
  const { data: { user } } = await supabase.auth.getUser();

  let progress = null;
  let recommendedExercises: Exercise[] = [];

  if (user) {
    const [progressData, exercisesData] = await Promise.all([
      getParcoursProgress(user.id, parcours.level, parcours.category, supabase),
      getRecommendedExercises(user.id, parcours.level, parcours.category, supabase)
    ]);
    progress = progressData;
    recommendedExercises = exercisesData;
  }

  // Fetch guide slug
  const { data: guideData } = await supabase
    .from('guides')
    .select('slug')
    .eq('parcours_id', id)
    .eq('is_published', true)
    .maybeSingle();

  return (
    <ParcoursInteractive
      parcours={parcours}
      allLessons={allLessons}
      initialProgress={progress}
      initialRecommendedExercises={recommendedExercises}
      initialGuideSlug={guideData?.slug || null}
      user={user}
    />
  );
}
