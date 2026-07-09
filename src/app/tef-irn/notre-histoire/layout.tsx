import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Notre histoire - LlamaKusi",
  description:
    "L'histoire d'Olivier et Grecia, fondateurs de LlamaKusi : pourquoi un ingénieur IA et une ingénieure civile ont créé le coach IA du TEF IRN à partir de leur propre parcours de naturalisation.",
};

export default function NotreHistoireLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
