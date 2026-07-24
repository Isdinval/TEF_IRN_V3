import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AdminGuardState } from "@/hooks/useAdminGuard";

const ACCESS_DENIED_IMAGE_URL =
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/ACCES_RESERVE_ADMIN/ACCES_RESERVE_ADMIN.webp";

export function AdminGuardScreen({ state }: { state: Exclude<AdminGuardState, "granted"> }) {
  if (state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-8">
      {/* eslint-disable-next-line @next/next/no-img-element -- image externe (Supabase Storage), next/image nécessiterait de whitelister ce hostname pour un usage ponctuel */}
      <img
        src={ACCESS_DENIED_IMAGE_URL}
        alt="Accès refusé, zone réservée aux administrateurs"
        className="max-w-xs w-full rounded-2xl shadow-xl"
      />
      <div className="space-y-2 max-w-md">
        <h1 className="text-xl font-black text-zinc-900">Alerte, zone top secrète !</h1>
        <p className="text-sm text-zinc-500">
          Tu viens de franchir une frontière que seuls les administrateurs peuvent traverser.
          Nos services de sécurité (un stagiaire et une base de données) ont été notifiés. 🕵️
        </p>
        <p className="text-xs text-zinc-400">
          Si tu es admin et que tu vois ça par erreur, vérifie que tu es bien connecté avec le bon compte.
        </p>
      </div>
      <Link
        href="/tef-irn"
        className="h-11 px-6 rounded-xl bg-zinc-900 text-white font-black text-sm flex items-center justify-center"
      >
        Rentrer dans le rang
      </Link>
    </div>
  );
}
