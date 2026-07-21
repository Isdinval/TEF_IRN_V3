import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestion des cookies - LlamaKusi",
  description:
    "Quels cookies et traceurs LlamaKusi utilise (authentification, mesure d'audience) et comment les gérer.",
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
