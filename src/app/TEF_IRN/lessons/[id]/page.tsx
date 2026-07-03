import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import LessonInteractive from './LessonInteractive';
import Script from 'next/script';
import { siteUrl } from '@/lib/site';
import JsonLd from '@/components/shared/JsonLd';

export default async function LessonPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  // Fetch lesson data
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (!lesson) {
    notFound();
  }

  // Fetch exercise data
  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', id)
    .eq('type', 'qcm')
    .limit(1)
    .maybeSingle();

  // Fetch user session
  const { data: { user } } = await supabase.auth.getUser();

  const lessonUrl = `${siteUrl}/TEF_IRN/lessons/${id}`;

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
    "datePublished": lesson.created_at || "2024-01-01",
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
        "item": `${siteUrl}/TEF_IRN/lessons`
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
  if (lesson.content && (lesson.content.includes('?') || lesson.objective.includes('?'))) {
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
            <p>Date: {new Date(lesson.created_at).getFullYear()}</p>
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
