import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  checkComprehensionQuota,
  comprehensionQuotaMessage,
} from "@/lib/comprehension-quota";

// Contrôle en lecture seule (aucun incrément) appelé à l'ouverture d'un sujet
// de pratique CE/CO, pour afficher l'écran de blocage avant que l'utilisateur
// ne lise le texte. La vraie protection reste dans /api/comprehension/complete
// (seul point qui délivre la correction).
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { skill, scenarioId } = await request.json();
  if ((skill !== "CE" && skill !== "CO") || typeof scenarioId !== "string") {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  const quota = await checkComprehensionQuota(
    supabase,
    user.id,
    skill,
    profile?.subscription_tier,
    [scenarioId]
  );

  if (!quota.allowed) {
    return NextResponse.json(
      { error: comprehensionQuotaMessage(skill, quota.limit ?? 0), limit: quota.limit },
      { status: 429 }
    );
  }

  return NextResponse.json({ allowed: true, limit: quota.limit, used: quota.used });
}
