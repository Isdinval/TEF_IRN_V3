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

  const admin = createAdminClient();

  const { data: deletedCount, error } = await admin.rpc("admin_reset_user_progress", {
    p_target_user_id: userId,
    p_admin_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: targetUser } = await admin.auth.admin.getUserById(userId);

  await admin.from("admin_actions_log").insert({
    admin_id: user.id,
    admin_email: user.email ?? "",
    action: "reset_progress",
    target_user_id: userId,
    target_email: targetUser.user?.email ?? "",
    details: { deletedCount },
  });

  return NextResponse.json({ success: true, deletedCount });
}
