import { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gestion des cookies - LlamaKusi",
  description:
    "Quels cookies et traceurs LlamaKusi utilise (authentification, mesure d'audience) et comment les gérer.",
  alternates: { canonical: `${siteUrl}/tef-irn/cookies` },
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
