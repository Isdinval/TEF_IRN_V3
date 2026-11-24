import { renderOgCard } from "@/lib/og/card";
import { getCentresOg } from "@/lib/og/data";

export const runtime = "nodejs";
export const revalidate = 86400;
export const alt = "Centres d'examen civique agréés en France | LlamaKusi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return renderOgCard(await getCentresOg());
}
