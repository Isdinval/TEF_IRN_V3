import { createClient } from "@/lib/supabase-server";
import {
  getParcoursBySlug,
  getParcoursById,
  getLessonsForParcours,
  getParcoursProgress,
  getUnlockedLessonIds,
  getUnlockedExercisesCatalogue,
  Exercise
} from "@/lib/parcours";
import { resolveNextExercises } from "@/lib/recommendation-resolver";
import { notFound, redirect } from "next/navigation";
import ParcoursInteractive from "./ParcoursInteractive";
import JsonLd from "@/components/shared/JsonLd";
import { siteUrl } from "@/lib/site";

export default async function ParcoursDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = await createClient();

  let parcours = await getParcoursBySlug(slug, supabase);

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!parcours && uuidRegex.test(slug)) {
    const parcoursById = await getParcoursById(slug, supabase);
    if (parcoursById) {
      redirect(`/tef-irn/parcours/${parcoursById.slug}`);
    }
  }

  if (!parcours) {
    notFound();
  }

  const allLessons = await getLessonsForParcours(parcours.level, parcours.category, supabase);

  const { data: { user } } = await supabase.auth.getUser();

  let progress = null;
  let recommendedExercises: Exercise[] = [];
  let catalogueExercises: (Exercise & { is_completed?: boolean; attempts_count?: number })[] = [];
  let learningMode: 'academique' | 'libre' = 'libre';

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('learning_mode')
      .eq('id', user.id)
      .maybeSingle();
    learningMode = (profileData?.learning_mode as 'academique' | 'libre') || 'libre';

    // progress doit être connu avant d'appeler resolveNextExercises() : on en
    // dérive la leçon "en cours" (currentLessonId) pour activer les paliers
    // 1/2 du moteur (contexte-leçon), inertes tant que lessonId est absent --
    // cf. resolveNextExercises() dans recommendation-resolver.ts. weakTags
    // ne dépend pas de progress, donc requêté en parallèle.
    const [progressData, weakTagsResult] = await Promise.all([
      getParcoursProgress(user.id, parcours.level, parcours.category, parcours.id, supabase),
      // user_errors.category est Capitalisé en base (ex. "Grammaire") alors
      // que parcours.category est en minuscule (ex. "grammaire") -- vérifié
      // en base live, même divergence de casse que exercises.category déjà
      // gérée dans recommendation-resolver.ts.
      supabase
        .from('user_errors')
        .select('sub_category, frequency')
        .eq('user_id', user.id)
        .eq('category', parcours.category.charAt(0).toUpperCase() + parcours.category.slice(1))
        .not('sub_category', 'is', null)
        .order('frequency', { ascending: false })
        .limit(5)
    ]);
    progress = progressData;

    // Contexte de recommandation = dernière leçon TERMINÉE (pas la prochaine à
    // faire) : les paliers 1/2 de resolveNextExercises() proposent des exercices
    // liés à cette leçon ("Lié à la leçon que tu viens de terminer"), il serait
    // incohérent de recommander sur du contenu pas encore lu. allLessons est
    // trié par order_index -- on parcourt à l'envers pour trouver la dernière
    // complétée dans l'ordre du parcours. undefined si aucune leçon terminée
    // (nouvel utilisateur) : le moteur retombe alors sur le pool large (tiers 3/4).
    const currentLessonId = [...allLessons].reverse().find(
      (lesson) => progress!.completedLessons.includes(lesson.id)
    )?.id;

    const weakTags = (weakTagsResult.data || [])
      .map((row: { sub_category: string | null }) => row.sub_category)
      .filter((tag): tag is string => !!tag);

    // Calculé une seule fois, réutilisé par le moteur de reco (hero) ET le
    // catalogue complet (accordéon, item #6) -- même périmètre garanti entre
    // les deux, pas de risque de divergence si l'un des deux appels change un jour.
    const unlockedLessonIds = getUnlockedLessonIds(allLessons, progress.completedLessons);

    [recommendedExercises, catalogueExercises] = await Promise.all([
      resolveNextExercises(
        user.id,
        {
          level: parcours.level,
          category: parcours.category,
          lessonId: currentLessonId,
          tags: weakTags.length > 0 ? weakTags : undefined,
          unlockedLessonIds,
        },
        supabase
      ),
      getUnlockedExercisesCatalogue(parcours.level, parcours.category, unlockedLessonIds, user.id, supabase),
    ]);
  }

  const lessonMeta: Record<string, { title: string; order_index: number }> = {};
  allLessons.forEach((lesson) => {
    lessonMeta[lesson.id] = { title: lesson.title, order_index: lesson.order_index };
  });

  const { data: guideData } = await supabase
    .from('guides')
    .select('slug')
    .eq('parcours_id', parcours.id)
    .eq('is_published', true)
    .maybeSingle();

  const parcoursUrl = `${siteUrl}/tef-irn/parcours/${parcours.slug}`;

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": `${parcours.category} ${parcours.level}`,
    "description": parcours.objective,
    "educationalLevel": parcours.level,
    "provider": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "url": siteUrl,
      "logo": `${siteUrl}/logo.png`
    },
    "hasPart": allLessons.map(lesson => ({
      "@type": "Lesson",
      "name": lesson.title,
      "description": lesson.objective,
      "url": `${siteUrl}/tef-irn/lessons/${lesson.slug}`
    })),
    "teaches": "Maîtrise du français pour le TEF IRN",
    "learningResourceType": "LearningPath"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Parcours", "item": `${siteUrl}/tef-irn/parcours` },
      { "@type": "ListItem", "position": 3, "name": `${parcours.category} ${parcours.level}`, "item": parcoursUrl }
    ]
  };

  return (
    <>
      <JsonLd data={courseSchema} id="course-schema" />
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema" />
      <ParcoursInteractive
        parcours={parcours}
        allLessons={allLessons}
        initialProgress={progress}
        initialRecommendedExercises={recommendedExercises}
        catalogueExercises={catalogueExercises}
        lessonMeta={lessonMeta}
        initialGuideSlug={guideData?.slug || null}
        user={user}
        learningMode={learningMode}
      />
    </>
  );
}
