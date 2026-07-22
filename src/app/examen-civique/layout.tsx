import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Examen Civique | LlamaKusi",
  description: "Préparez l'examen civique (CSP, CR, naturalisation) avec une révision quotidienne intelligente (SRS) et des examens blancs chronométrés.",
  openGraph: {
    title: "Examen Civique | LlamaKusi",
    description: "Préparez l'examen civique avec une révision quotidienne intelligente et des examens blancs chronométrés.",
  },
};

export default function ExamenCiviqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
