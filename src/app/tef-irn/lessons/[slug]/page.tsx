import { createClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import LessonInteractive from './LessonInteractive';
import { siteUrl } from '@/lib/site';
import JsonLd from '@/components/shared/JsonLd';
import { getLessonBySlug, getLessonById, getLessonsForParcours, getParcoursProgress, getUnlockedLessonIds, getTrulyCompletedLessonIds } from '@/lib/parcours';

export default async function LessonPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const [lesson, { data: { user } }] = await Promise.all([
    getLessonBySlug(slug, supabase),
    supabase.auth.getUser(),
  ]);

  // Backward compatibility: if slug is a UUID, try to fetch by ID and redirect
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!lesson && uuidRegex.test(slug)) {
    const lessonById = await getLessonById(slug, supabase);
    if (lessonById) {
      redirect(`/tef-irn/lessons/${lessonById.slug}`);
    }
  }

  if (!lesson) {
    notFound();
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('learning_mode')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.learning_mode === 'academique') {
      const { data: parentParcours } = await supabase
        .from('parcours')
        .select('id, slug')
        .eq('level', lesson.level)
        .eq('category', lesson.category)
        .maybeSingle();

      if (parentParcours) {
        const [parcoursLessons, progress] = await Promise.all([
          getLessonsForParcours(lesson.level, lesson.category, supabase),
          getParcoursProgress(user.id, lesson.level, lesson.category, parentParcours.id, supabase),
        ]);
        const trulyCompletedLessonIds = await getTrulyCompletedLessonIds(
          user.id,
          progress.completedLessons,
          'academique',
          supabase
        );
        const unlockedLessonIds = getUnlockedLessonIds(parcoursLessons, trulyCompletedLessonIds);

        if (!unlockedLessonIds.has(lesson.id)) {
          redirect(`/tef-irn/parcours/${parentParcours.slug}?locked=1`);
        }
      }
    }
  }

  const lessonUrl = `${siteUrl}/tef-irn/lessons/${lesson.slug}`;

  // Structured Data - Course
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": lesson.title,
    "description": lesson.objective,
    "educationalLevel": lesson.level,
    "provider": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "url": siteUrl,
      "logo": `${siteUrl}/logo.png`
    },
    "hasPart": [
      {
        "@type": "WebPageElement",
        "name": "Théorie et exemples",
        "description": "Contenu pédagogique détaillé",
        "url": lessonUrl
      }
    ],
    "teaches": `Préparation au TEF IRN niveau ${lesson.level}`,
    "learningResourceType": "Lesson"
  };

  // Structured Data - LearningResource (GEO-optimized)
  const learningResourceSchema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": lesson.title,
    "description": lesson.objective,
    "learningResourceType": "Lesson",
    "educationalLevel": lesson.level,
    "teaches": lesson.title,
    "author": {
      "@type": "Organization",
      "name": "LlamaKusi"
    },
    "publisher": {
      "@id": `${siteUrl}/#organization`
    },
    "datePublished": (lesson as any).created_at || "2024-01-01",
    "inLanguage": "fr"
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
        "name": "Leçons",
        "item": `${siteUrl}/tef-irn/lessons`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": lesson.title,
        "item": lessonUrl
      }
    ]
  };

  // FAQ Schema
  let faqSchema = null;
  if (lesson.content && (lesson.content.includes('?') || (lesson.objective && lesson.objective.includes('?')))) {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `Quel est l'objectif de la leçon ${lesson.title} ?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": lesson.objective
          }
        }
      ]
    };
  }

  return (
    <>
      <JsonLd data={courseSchema} id="course-schema" />
      <JsonLd data={learningResourceSchema} id="learning-resource-schema" />
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema" />
      {faqSchema && (
        <JsonLd data={faqSchema} id="faq-schema" />
      )}

      <main className="min-h-screen pb-12">
        <article>
          {/* Hidden but crawlable E-E-A-T metadata for GEO bots */}
          <header className="sr-only">
            <h1>{lesson.title}</h1>
            <p>Niveau: {lesson.level} | Catégorie: {lesson.category}</p>
            <p>Auteur: LlamaKusi</p>
            <p>Date: {new Date((lesson as any).created_at || Date.now()).getFullYear()}</p>
            <p>Source: {siteUrl}</p>
          </header>

          <LessonInteractive
            lesson={lesson}
            initialUser={user}
          />
        </article>
      </main>
    </>
  );
}
