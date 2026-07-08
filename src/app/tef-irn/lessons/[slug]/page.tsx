import { createClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import LessonInteractive from './LessonInteractive';
import { siteUrl } from '@/lib/site';
import JsonLd from '@/components/shared/JsonLd';
import { getLessonBySlug, getLessonById } from '@/lib/parcours';

export default async function LessonPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = await createClient();

  let lesson = await getLessonBySlug(slug, supabase);

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

  // Fetch exercise data
  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', lesson.id)
    .eq('type', 'qcm')
    .limit(1)
    .maybeSingle();

  // Fetch user session
  const { data: { user } } = await supabase.auth.getUser();

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

  if (exercise) {
    courseSchema.hasPart.push({
      "@type": "WebPageElement",
      "name": "Quiz Interactif",
      "description": "Validation des acquis avec score",
      "url": lessonUrl
    });
  }

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
            exercise={exercise}
            initialUser={user}
          />
        </article>
      </main>
    </>
  );
}
