import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation - LlamaKusi",
  description:
    "Conditions générales d'utilisation de LlamaKusi, plateforme de préparation au TEF IRN : accès au service, abonnements, propriété intellectuelle et responsabilités.",
};

export default function ConditionsUtilisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
