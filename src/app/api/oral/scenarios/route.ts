import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: scenarios, error } = await supabase
    .from("oral_exam_scenarios")
    .select("id, section, level, title, role_interlocuteur, sujet")
    .eq("is_active", true)
    .order("section", { ascending: true })
    .order("level", { ascending: true });

  if (error) {
    console.error("Supabase scenarios list error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des scénarios" }, { status: 500 });
  }

  return NextResponse.json({ scenarios: scenarios || [] });
}
