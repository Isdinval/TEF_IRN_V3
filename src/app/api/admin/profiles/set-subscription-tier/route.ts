import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

const VALID_TIERS = ["gratuit", "essentiel", "premium", "super_premium"] as const;
type SubscriptionTier = (typeof VALID_TIERS)[number];

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const { userId, subscriptionTier } = await request.json();
  if (!userId || typeof subscriptionTier !== "string" || !VALID_TIERS.includes(subscriptionTier as SubscriptionTier)) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: targetProfile, error: fetchError } = await admin
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .maybeSingle();
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  const previousTier = targetProfile?.subscription_tier ?? null;

  // Pas d'écriture ni de ligne de log si le palier ne change pas -- clic
  // répété sur la même valeur du select (pas d'action réelle à tracer).
  if (previousTier === subscriptionTier) {
    return NextResponse.json({ success: true, unchanged: true });
  }

  const { data: targetUser } = await admin.auth.admin.getUserById(userId);
  const targetEmail = targetUser.user?.email ?? "";

  const { error } = await admin.from("profiles").update({ subscription_tier: subscriptionTier }).eq("id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: logError } = await admin.from("admin_actions_log").insert({
    admin_id: user.id,
    admin_email: user.email ?? "",
    action: "change_subscription_tier",
    target_user_id: userId,
    target_email: targetEmail,
    details: { from: previousTier, to: subscriptionTier },
  });
  if (logError) {
    // Best-effort : le changement de palier a déjà réussi (update ci-dessus),
    // on ne fait pas échouer la requête pour un souci de log -- mais on ne
    // le laisse plus jamais passer sous silence comme avant ce correctif
    // (voir migration 20260909000005 : c'était une contrainte CHECK qui
    // rejetait 'change_subscription_tier', jamais surfacée).
    console.error("Échec du log admin_actions_log pour change_subscription_tier:", logError);
  }

  return NextResponse.json({ success: true });
}
