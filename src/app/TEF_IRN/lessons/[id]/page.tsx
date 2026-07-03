import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import LessonInteractive from './LessonInteractive';
import Script from 'next/script';
import { siteUrl } from '@/lib/site';

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
        "description": "Contenu pédagogique détaillé"
      },
      {
        "@type": "WebPageElement",
        "name": "Quiz Interactif",
        "description": "Validation des acquis avec score"
      }
    ],
    "teaches": [
      `Compétences de l'examen TEF IRN`,
      `Français niveau ${lesson.level}`,
      lesson.category
    ],
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
      "@type": "Organization",
      "name": "LlamaKusi"
    },
    "datePublished": "2024-01-01", // Or dynamic if available
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
        "item": `${siteUrl}/TEF_IRN/lessons/${id}`
      }
    ]
  };

  // Extract FAQ if possible (simple heuristic for GEO)
  // We'll look for common Q&A patterns in the content or objective
  let faqSchema = null;
  if (lesson.content && (lesson.content.includes('?') || lesson.objective.includes('?'))) {
    // This is a simplified version. Ideally, you'd extract real Q&As.
    // For now, we provide one main question based on the objective.
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
      <Script
        id="course-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <Script
        id="learning-resource-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(learningResourceSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <main className="min-h-screen pb-12">
        <article>
          {/* Hidden but crawlable E-E-A-T metadata for GEO bots */}
          <header className="sr-only">
            <h1>{lesson.title}</h1>
            <p>Niveau: {lesson.level} | Catégorie: {lesson.category}</p>
            <p>Auteur: LlamaKusi</p>
            <p>Date: 2024</p>
            <p>Source: https://llamakusi.com</p>
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
