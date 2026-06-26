import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centre d’entraînement QCM | LlamaKusi",
  description: "Renforcez sereinement votre grammaire, conjugaison et vocabulaire grâce à des QCM adaptés au TEF IRN. Construisez votre réussite étape par étape.",
  openGraph: {
    title: "Centre d’entraînement QCM | LlamaKusi",
    description: "Renforcez sereinement votre grammaire, conjugaison et vocabulaire grâce à des QCM adaptés au TEF IRN.",
  },
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
