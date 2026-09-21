import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  checkComprehensionQuota,
  comprehensionQuotaMessage,
} from "@/lib/comprehension-quota";
import { normalizeTier } from "@/lib/entitlements";
import { captureServerEvent } from "@/lib/posthog-server";

// Contrôle en lecture seule (aucun incrément) appelé à l'ouverture d'un sujet
// de pratique CE/CO, pour afficher l'écran de blocage avant que l'utilisateur
// ne lise le texte. La vraie protection reste dans /api/comprehension/complete
// (seul point qui délivre la correction).
//
// Sans scenarioId : renvoie seulement { limit, used } (limit = null pour un
// palier payant) pour le badge « sujet gratuit aujourd'hui » des catalogues.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { skill, scenarioId } = await request.json();
  if ((skill !== "CE" && skill !== "CO") || (scenarioId !== undefined && typeof scenarioId !== "string")) {
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
    scenarioId ? [scenarioId] : []
  );

  if (!scenarioId) {
    return NextResponse.json({ limit: quota.limit, used: quota.used });
  }

  const tier = normalizeTier(profile?.subscription_tier);

  if (!quota.allowed) {
    await captureServerEvent(user.id, "comprehension_quota_reached", {
      skill,
      subscription_tier: tier,
      limit: quota.limit,
      source: "check",
    });
    return NextResponse.json(
      { error: comprehensionQuotaMessage(skill, quota.limit ?? 0), limit: quota.limit },
      { status: 429 }
    );
  }

  await captureServerEvent(user.id, "comprehension_scenario_started", {
    skill,
    scenario_id: scenarioId,
    subscription_tier: tier,
    used: quota.used,
    limit: quota.limit,
  });

  return NextResponse.json({ allowed: true, limit: quota.limit, used: quota.used });
}
