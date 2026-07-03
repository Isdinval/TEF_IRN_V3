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
import JsonLd from "@/components/shared/JsonLd";
import { siteUrl } from "@/lib/site";

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
      getParcoursProgress(user.id, parcours.level, parcours.category, parcours.id, supabase),
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

  const parcoursUrl = `${siteUrl}/TEF_IRN/parcours/${id}`;

  // Structured Data - Course
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
      "url": `${siteUrl}/TEF_IRN/lessons/${lesson.id}`
    })),
    "teaches": "Préparation complète au TEF IRN",
    "learningResourceType": "LearningPath"
  };

  // Structured Data - Breadcrumb
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Parcours",
        "item": `${siteUrl}/TEF_IRN/parcours`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${parcours.category} ${parcours.level}`,
        "item": parcoursUrl
      }
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
