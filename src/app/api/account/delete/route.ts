import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

// Chantier abonnements, item 5 (2026-09) : vraie suppression self-service,
// à la place de l'ancienne simulation (setTimeout + email support) de
// SecuritySection. Reprend la même logique de cascade que la route admin
// (/api/admin/profiles/delete), initiée ici par l'utilisateur sur son
// propre compte -- pas de check is_admin appelant, mais mêmes garde-fous
// (compte admin, palier payant) appliqués à sa propre situation.
export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_admin) {
    return NextResponse.json(
      { error: "Un compte administrateur ne peut pas être supprimé en self-service. Contactez le support." },
      { status: 409 }
    );
  }

  if (profile?.subscription_tier && profile.subscription_tier !== "gratuit") {
    return NextResponse.json(
      { error: "Votre abonnement est encore actif. Contactez le support pour le résilier avant de supprimer votre compte." },
      { status: 409 }
    );
  }

  // Log inséré avant la suppression, même raison que la route admin :
  // admin_id/target_user_id repassent à NULL après la cascade (ON DELETE
  // SET NULL), mais admin_email/target_email (dénormalisés) restent
  // lisibles dans l'historique.
  await admin.from("admin_actions_log").insert({
    admin_id: user.id,
    admin_email: user.email ?? "",
    action: "self_delete_account",
    target_user_id: user.id,
    target_email: user.email ?? "",
  });

  // Supprime auth.users -> cascade automatique vers profiles et toutes les
  // tables liées (19 FK en ON DELETE CASCADE sur profiles(id)).
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
