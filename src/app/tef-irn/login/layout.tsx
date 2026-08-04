import { Metadata } from "next";

export const metadata: Metadata = {
  // Chaîne courte (pas de suffixe "- LlamaKusi" ici) : le title.template
  // du layout racine ("%s | LlamaKusi") s'en charge déjà. Le mettre en dur
  // ici produirait un doublon ("... - LlamaKusi | LlamaKusi").
  title: "Connexion",
  description:
    "Connectez-vous à LlamaKusi pour continuer votre préparation au TEF IRN : coaching IA à l'écrit et à l'oral, suivi de votre progression.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
