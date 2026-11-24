import { renderOgCard } from "@/lib/og/card";
import { OG_PAGES } from "@/lib/og/pages";

export const runtime = "nodejs";
export const alt = "LlamaKusi — Livret du citoyen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgCard(OG_PAGES.livret);
}
