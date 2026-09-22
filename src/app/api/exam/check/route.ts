import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { checkExamSectionTrial, examTrialMessage } from '@/lib/exam-quota';
import { normalizeTier } from '@/lib/entitlements';
import { captureServerEvent } from '@/lib/posthog-server';

// Contrôle en lecture seule (aucune écriture) appelé à l'ouverture d'une
// section CE/CO de l'examen blanc (SectionTransition.tsx), pour afficher
// l'écran de blocage avant que l'utilisateur ne passe 20 questions dessus.
// La vraie protection reste dans /api/exam/ce-co-complete (seul point qui
// délivre la correction) -- même duo check/complete que la pratique libre
// CE/CO (comprehension/check + comprehension/complete).
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { section } = await req.json();
  if (section !== 'CE' && section !== 'CO') {
    return NextResponse.json({ error: 'Paramètre invalide.' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();

  const trial = await checkExamSectionTrial(supabase, user.id, section, profile?.subscription_tier);
  const tier = normalizeTier(profile?.subscription_tier);

  if (!trial.allowed) {
    await captureServerEvent(user.id, 'exam_trial_blocked', {
      section,
      subscription_tier: tier,
      source: 'check',
    });
    return NextResponse.json({ error: examTrialMessage(section), used: true }, { status: 429 });
  }

  return NextResponse.json({ allowed: true, used: trial.used });
}
