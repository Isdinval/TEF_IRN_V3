"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Compass, Sparkles, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface NextActionParcours {
  slug: string;
  level: string;
  category: string;
}

interface NextActionRecommendation {
  type: string;
  reason: string;
  reference_id: string;
  slug?: string;
  category?: string | null;
  sub_category?: string | null;
  level?: string | null;
}

interface NextActionCardProps {
  vocabReviewsDue: number;
  exerciseReviewsDue: number;
  inProgressParcours: NextActionParcours[];
  recommendations: NextActionRecommendation[];
  targetExamDate: string | null;
}

// Même logique de routing par type que RecommendationCard.tsx -- dupliquée
// volontairement (petit composant autonome, pas d'abstraction partagée pour
// deux cards qui peuvent évoluer indépendamment).
function getRecommendationUrl(reco: NextActionRecommendation): string {
  switch (reco.type) {
    case 'lesson':
      return `/tef-irn/lessons/${reco.slug || reco.reference_id}`;
    case 'exercise':
    case 'review': {
      if (!reco.category) return '/tef-irn/practice';
      const params = new URLSearchParams({ topic: reco.category });
      if (reco.sub_category) params.set('tag', reco.sub_category);
      if (reco.level) params.set('level', reco.level);
      return `/tef-irn/practice?${params.toString()}`;
    }
    case 'vocab':
      return '/tef-irn/vocab';
    default:
      return '/tef-irn/practice';
  }
}

const EXAM_REMINDER_WINDOW_DAYS = 14;

export function NextActionCard({
  vocabReviewsDue,
  exerciseReviewsDue,
  inProgressParcours,
  recommendations,
  targetExamDate,
}: NextActionCardProps) {
  const router = useRouter();

  const daysUntilExam = targetExamDate
    ? Math.ceil((new Date(targetExamDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const totalReviewsDue = vocabReviewsDue + exerciseReviewsDue;

  // Arbitrage "une seule action" -- ordre volontaire, cf. commentaire du
  // patch : révisions SRS > parcours en cours > recommandation IA > examen
  // proche > découverte du Parcours guidé.
  let Icon = Compass;
  let title = "Découvrez le Parcours guidé";
  let description = "Laissez-vous porter : une leçon, ses exercices, puis la suivante, jusqu'au niveau visé.";
  let ctaLabel = "Découvrir";
  let targetUrl = "/tef-irn/parcours";

  if (totalReviewsDue > 0) {
    const prioritizeExercises = exerciseReviewsDue >= vocabReviewsDue;
    Icon = Zap;
    title = `${totalReviewsDue} révision${totalReviewsDue > 1 ? "s" : ""} vous attend${totalReviewsDue > 1 ? "ent" : ""}`;
    description = "Les révisions dues aujourd'hui sont prioritaires : plus vous attendez, plus elles seront difficiles à mémoriser.";
    ctaLabel = "Réviser maintenant";
    targetUrl = prioritizeExercises ? "/tef-irn/practice?mode=review" : "/tef-irn/vocab?review=true";
  } else if (inProgressParcours.length > 0) {
    const parcours = inProgressParcours[0];
    Icon = Compass;
    title = `Continuez votre parcours ${parcours.category} ${parcours.level}`;
    description = "Reprenez là où vous vous êtes arrêté.";
    ctaLabel = "Continuer";
    targetUrl = `/tef-irn/parcours/${parcours.slug}`;
  } else if (recommendations.length > 0) {
    const reco = recommendations[0];
    Icon = Sparkles;
    title = "Une recommandation du Coach IA vous attend";
    description = reco.reason;
    ctaLabel = "Commencer maintenant";
    targetUrl = getRecommendationUrl(reco);
  } else if (daysUntilExam !== null && daysUntilExam >= 0 && daysUntilExam <= EXAM_REMINDER_WINDOW_DAYS) {
    Icon = ClipboardCheck;
    title = `Votre examen approche (J-${daysUntilExam})`;
    description = "Un examen blanc dans les conditions réelles pour vérifier votre niveau avant le jour J.";
    ctaLabel = "Passer un examen blanc";
    targetUrl = "/tef-irn/exam";
  }

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xl shadow-indigo-200/50 rounded-[2.5rem]">
      <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
            <Icon size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100 mb-1">
              Prochaine action
            </p>
            <p className="text-lg font-black text-white tracking-tight">{title}</p>
            <p className="text-xs font-medium text-indigo-100 mt-1 max-w-md">{description}</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(targetUrl)}
          className="h-12 shrink-0 rounded-2xl bg-white font-black text-sm text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2"
        >
          {ctaLabel} <ArrowRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}
