"use client";

import { useEffect, useState } from "react";
import { useParcours } from "@/contexts/ParcoursContext";
import { ParcoursProgressBar } from "./ParcoursProgressBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, HelpCircle, Type, BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

// A2 (plan "ParcoursTopBar mobile") : même convention que
// vocab/page.tsx (LEVEL_SWITCHER_HINT_KEY) -- un indice ponctuel, affiché
// une seule fois par utilisateur, qui disparaît dès la 1re interaction avec
// la barre plutôt que via un bouton de fermeture dédié.
const PARCOURS_TOPBAR_HINT_KEY = "parcours_topbar_hint_seen";

export function ParcoursTopBar() {
  const { activeParcours, progress, nextLesson, nextExercise, nextVocabulary, vocabFullyMastered, exerciseCounts, academicQuotaMet, isLoading, learningMode } = useParcours();
  const pathname = usePathname();
  // Une seule action à la fois (nextLesson/nextExercise/nextVocabulary
  // partagent toutes plusieurs allers-retours Supabase) -- évite un double-clic
  // qui ouvrirait 2 onglets ou lancerait 2 navigations concurrentes.
  const [isResolving, setIsResolving] = useState(false);
  const [showTopbarHint, setShowTopbarHint] = useState(false);

  useEffect(() => {
    if (!activeParcours) return;
    try {
      if (!localStorage.getItem(PARCOURS_TOPBAR_HINT_KEY)) setShowTopbarHint(true);
    } catch { /* localStorage indisponible, pas d'indice affiché -- pas bloquant */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(activeParcours)]);

  const dismissHint = () => {
    if (!showTopbarHint) return;
    setShowTopbarHint(false);
    try { localStorage.setItem(PARCOURS_TOPBAR_HINT_KEY, "1"); } catch { /* localStorage indisponible, tant pis */ }
  };

  const handleNext = async (action: () => Promise<void>) => {
    if (isResolving) return;
    dismissHint();
    setIsResolving(true);
    try {
      await action();
    } finally {
      setIsResolving(false);
    }
  };

  // Show TopBar even during lesson reading/quiz if it's part of a parcours context
  // But we hide it for absolute immersion if requested, but here user wants it visible during quiz
  if (!activeParcours || isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 shrink-0 min-w-0">
            {/* Le libellé de catégorie/niveau reste visible sur mobile (juste
                plus étroit, tronqué) -- avant ce correctif, tout le bloc était
                hidden sm:block : un utilisateur arrivant sur cette barre sans
                être passé par /progression n'avait aucun moyen de savoir à
                quel parcours elle correspondait. Seule la légende "Parcours
                en cours" reste réservée à sm: et plus (texte d'appoint, pas
                l'info essentielle). */}
            <Link href="/tef-irn/progression" className="min-w-0 group" onClick={dismissHint}>
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5 group-hover:text-indigo-500 transition-colors">
                Parcours en cours
              </span>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 capitalize truncate max-w-[110px] sm:max-w-[200px] group-hover:text-indigo-600 transition-colors">
                {activeParcours.category} {activeParcours.level}
              </h4>
            </Link>

            <Link href={`/tef-irn/parcours/${activeParcours.slug}`} onClick={dismissHint}>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <ArrowLeft size={14} className="mr-1" /> Retour
              </Button>
            </Link>
          </div>

          {/* A3 (plan "ParcoursTopBar mobile") : sur mobile, seule une fine
              ligne colorée (tout en bas de la barre, cf. plus loin) donnait
              une idée très approximative de la progression, sans aucun
              chiffre. shrink-0 (et non flex-1) sur mobile pour ne pas
              grandir au détriment du groupe de boutons (qui compte déjà sur
              son propre overflow-x-auto comme filet de sécurité) -- le
              comportement flex-1/max-w-md d'origine reste inchangé à partir
              de md:. */}
          <div className="shrink-0 md:flex-1 md:max-w-md md:shrink">
            <span className="md:hidden inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-600 whitespace-nowrap">
              {progress?.percent}%
            </span>
            <div className="hidden md:block">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {progress?.completed} / {progress?.total} leçons
                </span>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  {progress?.percent}%
                </span>
              </div>
              <ParcoursProgressBar percent={progress?.percent || 0} />
            </div>
          </div>

          {/* min-w-0 + overflow-x-auto : filet de sécurité si ce groupe de
              boutons reste malgré tout plus large que l'espace disponible
              (ex. petit écran + plusieurs boutons simultanés) -- il défile
              alors lui-même au lieu de pousser toute la topbar/la page en
              débordement horizontal, même bug que DashboardSectionNav. */}
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
            {activeParcours.category === "vocabulaire" && (
              <Button
                onClick={() => handleNext(nextVocabulary)}
                disabled={isResolving || vocabFullyMastered}
                variant="outline"
                size="sm"
                className={`h-10 px-3 sm:px-4 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 ${
                  vocabFullyMastered
                    ? "border-emerald-200 text-emerald-600 bg-emerald-50 disabled:opacity-100"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
                aria-label={vocabFullyMastered ? "Vocabulaire de ce niveau déjà maîtrisé" : "Vocabulaire suivant"}
                title={vocabFullyMastered ? "Tout le vocabulaire de ce niveau est maîtrisé — bravo !" : undefined}
              >
                {vocabFullyMastered ? <CheckCircle2 size={14} className="mr-1" /> : <BookOpen size={14} className="mr-1" />}
                <span className="sm:hidden">{vocabFullyMastered ? "Maîtrisé" : "Vocabulaire"}</span>
                <span className="hidden sm:inline">{vocabFullyMastered ? "Niveau maîtrisé" : "Vocabulaire"}</span>
              </Button>
            )}

            {/* Item #4 (plan "Verrouillage exercices topbar/parcours"), Option 1 validée :
                un bouton par type d'exercice plutôt qu'un compteur agrégé -- QCM (/practice)
                et Chasse aux erreurs (/grammar-check) sont deux formats pédagogiques
                distincts, un total agrégé aurait laissé deviner lequel serait proposé au
                clic. exerciseCounts === null tant que non encore calculé (chargement
                initial ou fire-and-forget pas terminé) : bouton affiché sans nombre plutôt
                que cacher/bloquer, reste cliquable (résolution normale du moteur de reco).
                count === 0 : même traitement que "Vocabulaire" (vocabFullyMastered) --
                désactivé, coché, pour signaler que tout est fait plutôt que de laisser
                cliquer dans le vide. */}
            <Button
              onClick={() => handleNext(() => nextExercise('qcm'))}
              disabled={isResolving || exerciseCounts?.qcm === 0}
              variant="outline"
              size="sm"
              className={`h-10 px-3 sm:px-4 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 ${
                exerciseCounts?.qcm === 0
                  ? "border-emerald-200 text-emerald-600 bg-emerald-50 disabled:opacity-100"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
              aria-label={exerciseCounts?.qcm === 0 ? "QCM de la leçon en cours terminés" : "QCM suivant"}
              title={exerciseCounts?.qcm === 0 ? "Tous les QCM débloqués sont terminés — bravo !" : undefined}
            >
              {exerciseCounts?.qcm === 0 ? <CheckCircle2 size={14} className="mr-1" /> : <HelpCircle size={14} className="mr-1" />}
              <span>
                QCM{exerciseCounts && exerciseCounts.qcm > 0 ? ` (${exerciseCounts.qcm})` : ""}
              </span>
            </Button>

            <Button
              onClick={() => handleNext(() => nextExercise('trous'))}
              disabled={isResolving || exerciseCounts?.trous === 0}
              variant="outline"
              size="sm"
              className={`h-10 px-3 sm:px-4 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 ${
                exerciseCounts?.trous === 0
                  ? "border-emerald-200 text-emerald-600 bg-emerald-50 disabled:opacity-100"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
              aria-label={exerciseCounts?.trous === 0 ? "Chasse aux erreurs de la leçon en cours terminée" : "Chasse aux erreurs suivante"}
              title={exerciseCounts?.trous === 0 ? "Toute la chasse aux erreurs débloquée est terminée — bravo !" : undefined}
            >
              {exerciseCounts?.trous === 0 ? <CheckCircle2 size={14} className="mr-1" /> : <Type size={14} className="mr-1" />}
              <span className="sm:hidden">
                Trous{exerciseCounts && exerciseCounts.trous > 0 ? ` (${exerciseCounts.trous})` : ""}
              </span>
              <span className="hidden sm:inline">
                Chasse aux erreurs{exerciseCounts && exerciseCounts.trous > 0 ? ` (${exerciseCounts.trous})` : ""}
              </span>
            </Button>

            {(learningMode !== "academique" || academicQuotaMet) && (
              <Button
                onClick={() => handleNext(nextLesson)}
                disabled={isResolving}
                size="sm"
                className="h-10 px-4 bg-zinc-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-zinc-200 transition-all active:scale-95"
              >
                <span className="hidden sm:inline">Leçon suivante</span>
                <ChevronRight size={14} className="sm:ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* A2 (plan "ParcoursTopBar mobile") : indice ponctuel expliquant le
            rôle de la barre, 1re visite mobile uniquement -- disparaît dès
            la 1re interaction avec la barre (voir dismissHint). Pas de
            bouton de fermeture dédié, ni d'animation de sortie : même
            convention que l'indice du level switcher sur /tef-irn/vocab. */}
        {showTopbarHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="sm:hidden overflow-hidden bg-indigo-50/80 border-t border-indigo-100"
          >
            <p className="max-w-7xl mx-auto px-4 py-1.5 text-[10px] font-bold text-indigo-600">
              💡 Cette barre suit votre parcours guidé en cours — touchez le titre pour le retrouver.
            </p>
          </motion.div>
        )}

        <div className="md:hidden h-1 w-full bg-zinc-50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress?.percent}%` }}
            className="h-full bg-indigo-600"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
