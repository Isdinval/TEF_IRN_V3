import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

// Compte fondateur : jamais bloqué par la protection "dernier admin", même
// s'il est le seul admin restant en base. Décision produit explicite — pas
// une négligence : toute autre tentative de retirer le dernier admin est
// refusée pour éviter un verrouillage complet de la zone admin.
const FOUNDER_EMAIL = "olivier.raymond.17@eigsi.fr";

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

  const { userId, isAdmin } = await request.json();
  if (!userId || typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (!isAdmin) {
    const { count, error: countError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true);
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) <= 1) {
      const { data: targetUser } = await admin.auth.admin.getUserById(userId);
      if (targetUser.user?.email !== FOUNDER_EMAIL) {
        return NextResponse.json(
          { error: "Impossible de retirer le statut admin du dernier administrateur restant." },
          { status: 409 }
        );
      }
    }
  }

  const { error } = await admin.from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
