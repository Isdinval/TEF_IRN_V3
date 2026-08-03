import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

// Admin API listUsers pagine par 50 par défaut ; on force un perPage large.
// À revisiter si la base dépasse ~1000 comptes (pagination réelle côté UI).
const MAX_USERS = 1000;

export async function GET(request: NextRequest) {
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

  const admin = createAdminClient();

  const [{ data: profiles, error: profilesError }, { data: usersPage, error: usersError }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, username, full_name, current_level, subscription_tier, is_admin, created_at, total_xp, last_activity_at")
      .order("created_at", { ascending: false })
      .limit(MAX_USERS),
    admin.auth.admin.listUsers({ page: 1, perPage: MAX_USERS }),
  ]);

  if (profilesError || usersError) {
    return NextResponse.json({ error: (profilesError || usersError)?.message }, { status: 500 });
  }

  const emailById = new Map(usersPage.users.map((u) => [u.id, u.email ?? ""]));
  let merged = (profiles || []).map((p) => ({ ...p, email: emailById.get(p.id) || "" }));

  const search = request.nextUrl.searchParams.get("search")?.trim().toLowerCase();
  if (search) {
    merged = merged.filter((p) =>
      p.email.toLowerCase().includes(search) ||
      (p.username || "").toLowerCase().includes(search) ||
      (p.full_name || "").toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ profiles: merged });
}
