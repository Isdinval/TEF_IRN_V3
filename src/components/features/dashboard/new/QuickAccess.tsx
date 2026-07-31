"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Dumbbell, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface LastCorrection {
  created_at: string;
  exercise?: { category?: string | null; type?: string | null };
}

interface QuickAccessProps {
  lastCorrection?: LastCorrection | null;
}

function timeAgo(dateString: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

// Remplace l'ancien grid de 5 liens statiques (Parcours/Practice/Correction/
// Vocab/Exam) qui dupliquait intégralement la navigation de la sidebar sans
// apporter de donnée. Une seule CTA dynamique basée sur la dernière activité
// réelle de l'utilisateur (recent_corrections[0], déjà chargé par le
// dashboard) est plus utile qu'un menu de raccourcis déjà accessible ailleurs.
export function QuickAccess({ lastCorrection }: QuickAccessProps) {
  const router = useRouter();
  const category = lastCorrection?.exercise?.category;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-100 rounded-[2rem]">
      <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            {lastCorrection ? <Dumbbell size={24} /> : <Sparkles size={24} />}
          </div>
          <div>
            <p className="text-lg font-black text-zinc-900 capitalize">
              {lastCorrection ? `Reprendre : ${category || "votre entraînement"}` : "Prêt à commencer ?"}
            </p>
            <p className="text-xs font-bold text-zinc-500">
              {lastCorrection ? `Dernière activité ${timeAgo(lastCorrection.created_at)}` : "Aucune activité récente pour l'instant."}
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/tef-irn/practice")}
          className="h-14 rounded-2xl bg-zinc-900 font-black text-sm text-white hover:bg-black transition-all flex items-center gap-2 shrink-0"
        >
          {lastCorrection ? "Continuer" : "Découvrir les exercices"} <ArrowRight size={18} />
        </Button>
      </CardContent>
    </Card>
  );
}

