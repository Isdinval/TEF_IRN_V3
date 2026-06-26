import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chasse aux erreurs | LlamaKusi",
  description: "Perfectionnez votre conjugaison, grammaire, syntaxe et orthographe en repérant et corrigeant les erreurs. Progressez pas à pas en toute confiance.",
  openGraph: {
    title: "Chasse aux erreurs | LlamaKusi",
    description: "Perfectionnez votre conjugaison, grammaire, syntaxe et orthographe en repérant et corrigeant les erreurs.",
  },
};

export default function GrammarCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
