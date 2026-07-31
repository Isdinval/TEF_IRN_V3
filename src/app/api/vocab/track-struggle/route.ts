import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { analyzeVocabStruggleAndRecommend } from '@/lib/recommendation-engine';

// Appelée en fire-and-forget par vocab/page.tsx après un échec au step "type"
// (le SRS lui-même est déjà mis à jour côté client via updateVocabularySRS).
// Même pattern que analyzeUserErrorsAndRecommend, déclenché depuis
// exercise-complete / oral/analyze / writing/scenario-complete.
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    await analyzeVocabStruggleAndRecommend(user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Vocab recommendation engine error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
