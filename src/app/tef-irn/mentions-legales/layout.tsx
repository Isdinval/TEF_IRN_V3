import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales - LlamaKusi",
  description:
    "Mentions légales de LlamaKusi : éditeur du site, hébergement, directeur de la publication et propriété intellectuelle.",
  // TODO: retirer ce robots dès que l'identité juridique de l'éditeur est complétée ci-dessous
  robots: {
    index: false,
    follow: true,
  },
};

export default function MentionsLegalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
