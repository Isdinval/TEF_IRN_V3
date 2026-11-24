import { renderOgCard } from "@/lib/og/card";
import { OG_PAGES } from "@/lib/og/pages";

export const runtime = "nodejs";
export const alt = "LlamaKusi — Examen civique : suis-je concerné ?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgCard(OG_PAGES.eligibilite);
}
