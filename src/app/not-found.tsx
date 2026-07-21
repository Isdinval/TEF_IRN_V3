import Image from "next/image";
import type { Metadata } from "next";
import { NotFoundActions } from "@/components/shared/NotFoundActions";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="mx-auto w-full max-w-2xl rounded-[2rem] bg-amber-50/70 p-3 shadow-xl shadow-amber-900/10 ring-1 ring-amber-900/5 sm:p-4">
        <Image
          src="https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/erreur_404/erreur404_llamakusi.webp"
          alt="Le LlamaKusi, perplexe, une carte à la main, cherche son chemin au coucher du soleil"
          width={1616}
          height={656}
          priority
          className="h-auto w-full rounded-2xl [mask-image:radial-gradient(ellipse_at_center,black_92%,transparent_100%)]"
        />
      </div>

      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Oups, cette page s'est perdue en chemin
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          Le LlamaKusi a cherché partout, mais cette page n'existe pas ou a
          changé d'adresse. Retournons ensemble à l'entraînement.
        </p>
      </div>

      <NotFoundActions />
    </div>
  );
}
