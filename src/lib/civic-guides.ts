// Server-only (importe next/headers via supabase-server) — ne jamais importer ce fichier
// depuis un composant client. Les constantes partagées vivent dans civic-guide-categories.ts.
import { createClient } from "@/lib/supabase-server";
import { Guide } from "@/types/guides";
import { CIVIC_GUIDE_CATEGORIES } from "@/lib/civic-guide-categories";

/**
 * Récupère tous les guides publiés liés à l'examen civique (toutes démarches confondues).
 * Le filtrage par démarche (mention) se fait ensuite côté client dans CivicHub : à ce volume
 * (quelques dizaines de guides), un seul aller-retour serveur évite un refetch réseau
 * à chaque changement de démarche.
 */
export async function getCivicGuides(): Promise<Guide[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guides")
    .select("*")
    .eq("is_published", true)
    .in("category", CIVIC_GUIDE_CATEGORIES as unknown as string[])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching civic guides:", error);
    return [];
  }
  return data || [];
}
