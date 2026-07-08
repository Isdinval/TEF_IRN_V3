import { createClient } from "@/lib/supabase-server";
import {
  getParcoursBySlug,
  getParcoursById,
  getLessonsForParcours,
  getParcoursProgress,
  getRecommendedExercises,
  Exercise
} from "@/lib/parcours";
import { notFound, redirect } from "next/navigation";
import ParcoursInteractive from "./ParcoursInteractive";
import JsonLd from "@/components/shared/JsonLd";
import { siteUrl } from "@/lib/site";

export default async function ParcoursDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = await createClient();

  let parcours = await getParcoursBySlug(slug, supabase);

  // Backward compatibility
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
    .eq('parcours_id', parcours.id)
    .eq('is_published', true)
    .maybeSingle();

  const parcoursUrl = `${siteUrl}/tef-irn/parcours/${parcours.slug}`;

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
      "url": `${siteUrl}/tef-irn/lessons/${lesson.slug}`
    })),
    "teaches": "Maîtrise du français pour le TEF IRN",
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
        "item": `${siteUrl}/tef-irn/parcours`
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
