import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votre Lexique Immédiat | LlamaKusi",
  description: "Maîtrisez les mots clés du TEF IRN grâce à notre méthode active de mémorisation en 3 étapes : découverte, association, maîtrise.",
  openGraph: {
    title: "Votre Lexique Immédiat | LlamaKusi",
    description: "Maîtrisez les mots clés du TEF IRN grâce à notre méthode active de mémorisation en 3 étapes.",
  },
};

export default function VocabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
