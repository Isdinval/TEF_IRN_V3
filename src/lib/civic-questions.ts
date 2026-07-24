// Server-only (importe next/headers via supabase-server) — ne jamais importer ce fichier
// depuis un composant client.
import { createClient } from "@/lib/supabase-server";

export interface CivicQuestion {
  id: string;
  theme: string;
  mentions: string[];
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  source_ref: string | null;
  source_url: string | null;
}

/**
 * Récupère toutes les questions officielles de l'examen civique (toutes démarches et
 * thématiques confondues). Le filtrage par démarche (mention) et thématique se fait ensuite
 * côté client dans /parcourir : à ce volume (quelques dizaines de questions), un seul
 * aller-retour serveur évite un refetch réseau à chaque changement de filtre, et surtout
 * rend le contenu (questions, réponses, explications) présent dans le HTML initial pour
 * le SEO/GEO et les crawlers qui n'exécutent pas de JS.
 */
export async function getCivicQuestions(): Promise<CivicQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("civic_questions")
    .select("*")
    .order("theme");

  if (error) {
    console.error("Error fetching civic questions:", error);
    return [];
  }
  return (data as CivicQuestion[]) || [];
}
