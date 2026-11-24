import { renderOgCard } from "@/lib/og/card";
import { FALLBACK } from "@/lib/og/data";

// Carte de marque par défaut : pages sans image plus spécifique (convention Next.js : fichier le plus proche dans l'arborescence).
export const runtime = "nodejs";
export const alt = "LlamaKusi — Coach IA TEF IRN & Examen civique";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgCard(FALLBACK);
}
