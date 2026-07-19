import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: scenarios, error } = await supabase
    .from("writing_exam_scenarios")
    .select("id, section, level, type_texte, title, sujet, min_words, duration_seconds")
    .eq("is_active", true)
    .order("section", { ascending: true })
    .order("level", { ascending: true });

  if (error) {
    console.error("Supabase writing scenarios list error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des sujets" }, { status: 500 });
  }

  return NextResponse.json({ scenarios: scenarios || [] });
}
