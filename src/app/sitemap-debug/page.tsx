import { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { CIVIC_GUIDE_CATEGORIES } from '@/lib/civic-guide-categories';
import { SitemapDebugClient } from './SitemapDebugClient';

// Page de debug interne — jamais destinée aux visiteurs ni aux moteurs de recherche.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <ShieldAlert className="text-rose-500" size={48} />
      <h1 className="text-xl font-black text-zinc-900">Accès réservé aux administrateurs</h1>
      <p className="text-sm text-zinc-500">Cette page nécessite un compte marqué comme administrateur (profiles.is_admin).</p>
    </div>
  );
}

export default async function SitemapDebug() {
  const supabase = await createClient();

  // Vrai contrôle serveur (pas juste RLS) — même pattern que /api/admin/generate-exercise.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AccessDenied />;
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) return <AccessDenied />;

  // === Vue d'ensemble : comptages publié/total par table de contenu ===
  const [
    { count: lessonsTotal },
    { count: lessonsPublished },
    { count: civicQuestionsTotal },
    { count: civicQuestionsReviewed },
    { count: parcoursTotal },
    { data: guides },
  ] = await Promise.all([
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('civic_questions').select('*', { count: 'exact', head: true }),
    supabase.from('civic_questions').select('*', { count: 'exact', head: true }).eq('reviewed', true),
    supabase.from('parcours').select('*', { count: 'exact', head: true }),
    supabase.from('guides').select('category, is_published'),
  ]);

  const guidesData = guides || [];
  const civicGuides = guidesData.filter((g: any) => (CIVIC_GUIDE_CATEGORIES as readonly string[]).includes(g.category));
  const tefIrnGuides = guidesData.filter((g: any) => !(CIVIC_GUIDE_CATEGORIES as readonly string[]).includes(g.category));

  const overview = {
    lessons: { total: lessonsTotal || 0, published: lessonsPublished || 0 },
    tefIrnGuides: { total: tefIrnGuides.length, published: tefIrnGuides.filter((g: any) => g.is_published).length },
    civicGuides: { total: civicGuides.length, published: civicGuides.filter((g: any) => g.is_published).length },
    civicQuestions: { total: civicQuestionsTotal || 0, published: civicQuestionsReviewed || 0 },
    parcours: { total: parcoursTotal || 0 },
  };

  return <SitemapDebugClient overview={overview} />;
}
