import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { AdminGuardScreen } from '@/components/shared/AdminGuardScreen';
import { SitemapDebugClient } from './SitemapDebugClient';

// Page de debug interne — jamais destinée aux visiteurs ni aux moteurs de recherche.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SitemapDebug() {
  const supabase = await createClient();

  // Vrai contrôle serveur (pas juste RLS) — même pattern que /api/admin/generate-exercise.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AdminGuardScreen state="denied" />;
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) return <AdminGuardScreen state="denied" />;

  // === Vue d'ensemble : comptages par table de contenu ===
  // Note : lessons n'a pas de colonne de publication (confirmé par le schéma SQL) — total
  // seul, comme parcours. civic_questions utilise "reviewed" et guides "is_published".
  const [
    lessonsTotalRes,
    civicQuestionsTotalRes,
    civicQuestionsReviewedRes,
    parcoursTotalRes,
    guidesRes,
  ] = await Promise.all([
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('civic_questions').select('*', { count: 'exact', head: true }),
    supabase.from('civic_questions').select('*', { count: 'exact', head: true }).eq('reviewed', true),
    supabase.from('parcours').select('*', { count: 'exact', head: true }),
    supabase.from('guides').select('product, is_published'),
  ]);

  // On distingue explicitement "0 ligne correspond" d'une erreur de requête (mauvaise colonne,
  // policy RLS...) — un count masqué en 0 par erreur donnerait exactement le même affichage
  // qu'un vrai 0. C'est ce qui s'est produit avec lessons.is_published (colonne inexistante).
  const queryErrors = [
    lessonsTotalRes.error && `lessons (total) : ${lessonsTotalRes.error.message}`,
    civicQuestionsTotalRes.error && `civic_questions (total) : ${civicQuestionsTotalRes.error.message}`,
    civicQuestionsReviewedRes.error && `civic_questions (reviewed) : ${civicQuestionsReviewedRes.error.message}`,
    parcoursTotalRes.error && `parcours (total) : ${parcoursTotalRes.error.message}`,
    guidesRes.error && `guides : ${guidesRes.error.message}`,
  ].filter(Boolean) as string[];

  const guidesData = guidesRes.data || [];
  const civicGuides = guidesData.filter((g: any) => g.product === 'examen-civique');
  const tefIrnGuides = guidesData.filter((g: any) => g.product !== 'examen-civique');

  const overview = {
    lessons: { total: lessonsTotalRes.count || 0 },
    tefIrnGuides: { total: tefIrnGuides.length, published: tefIrnGuides.filter((g: any) => g.is_published).length },
    civicGuides: { total: civicGuides.length, published: civicGuides.filter((g: any) => g.is_published).length },
    civicQuestions: { total: civicQuestionsTotalRes.count || 0, published: civicQuestionsReviewedRes.count || 0 },
    parcours: { total: parcoursTotalRes.count || 0 },
  };

  return <SitemapDebugClient overview={overview} queryErrors={queryErrors} />;
}
