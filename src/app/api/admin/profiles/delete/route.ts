import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

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

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: "Impossible de supprimer votre propre compte." }, { status: 409 });
  }

  const admin = createAdminClient();

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("is_admin, subscription_tier")
    .eq("id", userId)
    .maybeSingle();

  if (!targetProfile) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  if (targetProfile.is_admin) {
    return NextResponse.json(
      { error: "Impossible de supprimer un compte admin. Rétrogradez-le d'abord." },
      { status: 409 }
    );
  }

  if (targetProfile.subscription_tier && targetProfile.subscription_tier !== "free") {
    return NextResponse.json(
      { error: "Ce compte a un abonnement actif. Annulez l'abonnement Stripe avant de supprimer le compte." },
      { status: 409 }
    );
  }

  const { data: targetUser } = await admin.auth.admin.getUserById(userId);
  const targetEmail = targetUser.user?.email ?? "";

  // Log inséré avant la suppression : target_user_id est en ON DELETE SET
  // NULL sur admin_actions_log, donc la FK est encore valide à cet instant.
  // Après auth.admin.deleteUser(), la cascade la remet à NULL et target_email
  // (dénormalisé) reste lisible dans l'historique.
  await admin.from("admin_actions_log").insert({
    admin_id: user.id,
    admin_email: user.email ?? "",
    action: "delete_account",
    target_user_id: userId,
    target_email: targetEmail,
  });

  // Supprime auth.users -> cascade automatique vers profiles et toutes les
  // tables liées (exercise_attempts, writing_scenario_attempts,
  // oral_session_results, user_errors, chat_sessions, etc. — 19 FK en
  // ON DELETE CASCADE sur profiles(id)). Pas de DELETE manuel à maintenir.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
