"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageCircle, ArrowRight, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { RecommendationCard } from "./RecommendationCard";
import { InfoTooltip } from "./InfoTooltip";

interface WeakPoint {
  category: string;
  sub_category: string | null;
  frequency: number;
  last_seen_at: string;
}

interface Recommendation {
  id: string;
  type: string;
  reason: string;
  reference_id: string;
  slug?: string;
  category?: string | null;
  sub_category?: string | null;
}

interface ActionPlanCardProps {
  weakPoints: WeakPoint[];
  recommendations: Recommendation[];
  onDismissed: () => void;
}

// Une reco et un point faible désignent le même problème dès lors que la
// catégorie et la sous-catégorie correspondent -- recommendation-engine.ts
// stocke justement ces deux colonnes sur `recommendations` pour ça.
function sameIssue(a: { category?: string | null; sub_category?: string | null }, b: { category?: string | null; sub_category?: string | null }) {
  return (a.category || null) === (b.category || null) && (a.sub_category || null) === (b.sub_category || null);
}

export function ActionPlanCard({ weakPoints, recommendations, onDismissed }: ActionPlanCardProps) {
  const router = useRouter();

  // Points faibles diagnostiqués mais pour lesquels aucune recommandation
  // n'existe encore (slots pleins, ou pas encore analysés).
  const orphanWeakPoints = weakPoints.filter(
    (wp) => !recommendations.some((reco) => sameIssue(reco, wp))
  );

  const handleDiscussOrphans = () => {
    const details = orphanWeakPoints
      .map((wp) => `${wp.category}${wp.sub_category ? ` (${wp.sub_category})` : ""} — ${wp.frequency} erreurs`)
      .join(", ");
    const prompt = `J'ai des difficultés sur : ${details}. Peux-tu m'expliquer ces erreurs et me proposer un exercice ciblé ?`;
    router.push(`/tef-irn/coach?prompt=${encodeURIComponent(prompt)}`);
  };

  const isEmpty = recommendations.length === 0 && orphanWeakPoints.length === 0;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
        <Badge className="bg-indigo-600 text-white rounded-full">IA Coach</Badge>
        Plan d'action
        <InfoTooltip text="Vos points faibles (erreurs les plus fréquentes) et les actions concrètes générées par le Coach IA pour les corriger : leçon, exercice ciblé ou révision de vocabulaire." />
      </h2>

      {isEmpty ? (
        <div className="p-12 text-center border-2 border-dashed rounded-[2.5rem] text-zinc-400">Continuez à pratiquer !</div>
      ) : (
        <div className="space-y-6">
          {recommendations.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {recommendations.map((reco) => {
                const match = weakPoints.find((wp) => sameIssue(reco, wp));
                return (
                  <RecommendationCard
                    key={reco.id}
                    id={reco.id}
                    type={reco.type}
                    reason={reco.reason}
                    referenceId={reco.reference_id}
                    slug={reco.slug}
                    frequency={match?.frequency}
                    onDismissed={onDismissed}
                  />
                );
              })}
            </div>
          )}

          {orphanWeakPoints.length > 0 && (
            <Card className="overflow-hidden border-none bg-rose-50/40 shadow-sm rounded-[2rem]">
              <CardContent className="p-6 space-y-4">
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                  <AlertCircle size={14} /> En attente d'une action ciblée
                </h3>
                <div className="space-y-2">
                  {orphanWeakPoints.map((wp, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5">
                      <div>
                        <p className="text-sm font-black text-zinc-900 capitalize">{wp.category}</p>
                        {wp.sub_category && <p className="text-xs text-zinc-500">{wp.sub_category}</p>}
                      </div>
                      <span className="text-xs font-black text-rose-500">×{wp.frequency}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleDiscussOrphans}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-zinc-900 font-black text-sm text-white hover:bg-black transition-all"
                >
                  <MessageCircle size={16} /> En discuter avec le Coach IA <ArrowRight size={16} />
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
