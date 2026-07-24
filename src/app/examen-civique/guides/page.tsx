import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { getCivicGuides } from "@/lib/civic-guides";
import { CivicGuideCatalogue } from "./CivicGuideCatalogue";

export const metadata: Metadata = {
  title: "Guides examen civique — Naturalisation, CSP, carte de résident | LlamaKusi",
  description:
    "Tous nos guides gratuits pour comprendre et réussir l'examen civique : naturalisation, carte de séjour pluriannuelle (CSP), carte de résident.",
  alternates: {
    canonical: `${siteUrl}/examen-civique/guides`,
  },
};

export default async function CivicGuidesPage() {
  const guides = await getCivicGuides();
  return <CivicGuideCatalogue guides={guides} />;
}
