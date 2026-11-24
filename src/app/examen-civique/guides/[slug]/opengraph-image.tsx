import { renderOgCard } from "@/lib/og/card";
import { getGuideOg } from "@/lib/og/data";

export const runtime = "nodejs";
export const revalidate = 86400;
export const alt = "LlamaKusi — Guide de l'examen civique";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderOgCard(await getGuideOg("examen-civique", slug));
}
