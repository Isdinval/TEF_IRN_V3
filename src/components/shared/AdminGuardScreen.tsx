import { Loader2, ShieldAlert } from "lucide-react";
import { AdminGuardState } from "@/hooks/useAdminGuard";

export function AdminGuardScreen({ state }: { state: Exclude<AdminGuardState, "granted"> }) {
  if (state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <ShieldAlert className="text-rose-500" size={48} />
      <h1 className="text-xl font-black text-zinc-900">Accès réservé aux administrateurs</h1>
      <p className="text-sm text-zinc-500">Cette page nécessite un compte marqué comme administrateur (profiles.is_admin).</p>
    </div>
  );
}
