import { createClient } from "@/lib/supabase-server";
import {
  getParcoursBySlug,
  getParcoursById,
  getLessonsForParcours,
  getParcoursProgress,
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

  if (user) {
    // progress doit être connu avant d'appeler resolveNextExercises() : on en
    // dérive la leçon "en cours" (currentLessonId) pour activer les paliers
    // 1/2 du moteur (contexte-leçon), inertes tant que lessonId est absent --
    // cf. resolveNextExercises() dans recommendation-resolver.ts. Perte de
    // parallélisme assumée, cette dépendance étant désormais réelle.
    progress = await getParcoursProgress(user.id, parcours.level, parcours.category, parcours.id, supabase);

    const currentLessonId = allLessons.find(
      (lesson) => !progress!.completedLessons.includes(lesson.id)
    )?.id;

    recommendedExercises = await resolveNextExercises(
      user.id,
      { level: parcours.level, category: parcours.category, lessonId: currentLessonId },
      supabase
    );
  }

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
        initialGuideSlug={guideData?.slug || null}
        user={user}
      />
    </>
  );
}
