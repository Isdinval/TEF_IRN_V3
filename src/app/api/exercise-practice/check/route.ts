import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkAiRateLimit, type AiRoute } from "@/lib/ai-rate-limit";

// Chantier abonnements, item 2 (2026-09). Un seul point d'entrée thin pour
// les 3 pages d'entraînement libre (vocab, practice, grammar-check), plutôt
// que 3 routes dupliquées -- voir ai-rate-limit.ts pour les chiffres et
// exercise-practice-client.ts pour le point d'appel côté client (une fois
// par exercice affiché, pas une fois par lot).
const ROUTE_BY_TYPE: Record<string, AiRoute> = {
  vocab: "vocab_exercise",
  qcm: "qcm_exercise",
  trous: "grammar_trous_exercise",
};

const LABEL_BY_TYPE: Record<string, string> = {
  vocab: "de vocabulaire",
  qcm: "de QCM",
  trous: "de chasse aux erreurs",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { type } = await request.json();
  const route = ROUTE_BY_TYPE[type];
  if (!route) {
    return NextResponse.json({ error: "Type d'exercice invalide." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  const rateLimit = await checkAiRateLimit(user.id, route, profile?.subscription_tier);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Limite quotidienne d'exercices ${LABEL_BY_TYPE[type]} atteinte (${rateLimit.limit}/jour). Passez à un palier payant pour un accès illimité.`,
        limit: rateLimit.limit,
      },
      { status: 429 }
    );
  }

  return NextResponse.json({ allowed: true, limit: rateLimit.limit });
}
