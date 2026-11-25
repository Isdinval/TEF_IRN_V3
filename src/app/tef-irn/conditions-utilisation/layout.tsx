import { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Conditions d'utilisation - LlamaKusi",
  description:
    "Conditions générales d'utilisation de LlamaKusi, préparation au TEF IRN : accès au service, abonnements, propriété intellectuelle et responsabilités.",
  alternates: { canonical: `${siteUrl}/tef-irn/conditions-utilisation` },
};

export default function ConditionsUtilisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
