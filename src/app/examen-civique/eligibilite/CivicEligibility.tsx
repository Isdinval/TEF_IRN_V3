"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCivicContext } from "@/components/features/examen-civique/useCivicContext";
import { MENTIONS, MENTION_TO_LEVEL, mentionLabel } from "@/lib/civic-constants";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CheckCircle2, XCircle, HelpCircle, ArrowLeft, RotateCcw, ExternalLink } from "lucide-react";

interface Situation {
  key: string;
  label: string;
  /** Démarches pour lesquelles cette situation est pertinente (cf. dialogue "Cas particuliers" du sommaire). */
  appliesTo: string[];
}

const SITUATIONS: Situation[] = [
  { key: "protection", label: "Réfugié·e, protection subsidiaire ou apatride", appliesTo: ["csp", "cr"] },
  { key: "age", label: "65 ans ou plus à la date de la demande", appliesTo: ["csp", "cr", "naturalisation"] },
  { key: "bilateral", label: "Accord bilatéral spécifique (ex. franco-algérien)", appliesTo: ["csp", "cr"] },
  { key: "medical", label: "Situation médicale ou handicap empêchant l'évaluation", appliesTo: ["csp", "cr", "naturalisation"] },
];

const TOTAL_STEPS = 3;

interface CivicEligibilityProps {
  faqItems: { q: string; a: string }[];
}

export function CivicEligibility({ faqItems }: CivicEligibilityProps) {
  const { setMention, buildHref } = useCivicContext();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mention, setLocalMention] = useState<string | null>(null);
  const [isFirstRequest, setIsFirstRequest] = useState<boolean | null>(null);
  const [situations, setSituations] = useState<Set<string>>(new Set());

  const visibleSituations = useMemo(
    () => SITUATIONS.filter((s) => !mention || s.appliesTo.includes(mention)),
    [mention]
  );

  // Une fois le résultat affiché, on aligne la démarche du contexte global (sommaire, entraînement,
  // examen blanc...) sur celle choisie dans le test, pour que le CTA propose directement la bonne mention.
  useEffect(() => {
    if (step === 4 && mention) setMention(mention);
  }, [step, mention, setMention]);

  const toggleSituation = (key: string) => {
    setSituations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const reset = () => {
    setStep(1);
    setLocalMention(null);
    setIsFirstRequest(null);
    setSituations(new Set());
  };

  const result = useMemo(() => {
    if (isFirstRequest === false) return "not-concerned" as const;
    if (situations.size > 0) return "maybe-dispensed" as const;
    return "concerned" as const;
  }, [isFirstRequest, situations]);

  const progressPct = step <= TOTAL_STEPS ? Math.round(((step - 1) / TOTAL_STEPS) * 100) : 100;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-5 py-8 lg:px-6 space-y-6">
        <ExerciseLayout
          title={<>Testez votre <span className="text-indigo-600">éligibilité</span></>}
          badge="3 questions · 30 secondes"
          description="Découvrez si l'examen civique est obligatoire dans votre situation, ou si vous pouvez en être dispensé(e)."
        />

        {/* Barre de progression */}
        {step <= TOTAL_STEPS && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Étape {step} / {TOTAL_STEPS}
              </p>
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-700"
                >
                  <ArrowLeft size={12} /> Précédent
                </button>
              )}
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Étape 1 : démarche */}
        {step === 1 && (
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-black text-zinc-900">Quelle démarche envisagez-vous ?</h2>
            <div className="grid grid-cols-1 gap-2">
              {MENTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    setLocalMention(m.value);
                    setStep(2);
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left"
                >
                  <div>
                    <p className="font-black text-sm text-zinc-900">{m.label}</p>
                    {m.shortLabel && <p className="text-xs text-zinc-400 font-medium">{m.shortLabel} · niveau {MENTION_TO_LEVEL[m.value]} requis</p>}
                  </div>
                  <ArrowLeft size={16} className="rotate-180 text-zinc-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 2 : première demande ou renouvellement */}
        {step === 2 && (
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-black text-zinc-900">
              S'agit-il de votre première demande de {mention && mentionLabel(mention).toLowerCase()} ?
            </h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              L'examen civique n'est exigé qu'une seule fois, lors de la toute première obtention du titre visé.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  setIsFirstRequest(true);
                  setStep(3);
                }}
                className="p-4 rounded-2xl border border-zinc-100 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left font-black text-sm text-zinc-900"
              >
                Oui, c'est ma première demande
              </button>
              <button
                onClick={() => {
                  setIsFirstRequest(false);
                  setStep(4);
                }}
                className="p-4 rounded-2xl border border-zinc-100 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left font-black text-sm text-zinc-900"
              >
                Non, c'est un renouvellement
              </button>
            </div>
          </div>
        )}

        {/* Étape 3 : situations particulières */}
        {step === 3 && (
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 space-y-4">
            <h2 className="text-base font-black text-zinc-900">Êtes-vous dans l'une de ces situations ?</h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Cochez tout ce qui s'applique. Ces situations peuvent donner lieu à une dispense.
            </p>
            <div className="space-y-2">
              {visibleSituations.map((s) => {
                const active = situations.has(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleSituation(s.key)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                      active ? "border-indigo-300 bg-indigo-50/50" : "border-zinc-100 hover:bg-zinc-50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                        active ? "bg-indigo-600 border-indigo-600" : "border-zinc-200"
                      }`}
                    >
                      {active && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <p className="text-sm font-bold text-zinc-800">{s.label}</p>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => setStep(4)}
              className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl text-sm"
            >
              {situations.size === 0 ? "Aucune de ces situations, continuer" : "Voir mon résultat"}
            </Button>
          </div>
        )}

        {/* Étape 4 : résultat */}
        {step === 4 && mention && (
          <div className="space-y-4">
            {result === "concerned" && (
              <div className="p-6 rounded-[2rem] bg-indigo-600 text-white shadow-lg shadow-indigo-100 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                  <HelpCircle size={20} />
                </div>
                <p className="text-lg font-black leading-tight">Vous devez passer l'examen civique</p>
                <p className="text-sm text-indigo-100 leading-relaxed">
                  Pour votre {mentionLabel(mention).toLowerCase()}, une attestation de réussite à l'examen civique
                  (niveau {MENTION_TO_LEVEL[mention]} requis) sera demandée lors de votre première demande.
                </p>
                <Link href={buildHref("/examen-civique/entrainement")}>
                  <Button className="w-full h-12 bg-white text-indigo-700 hover:bg-indigo-50 font-black rounded-2xl text-sm">
                    Commencer l'entraînement gratuit
                  </Button>
                </Link>
              </div>
            )}

            {result === "maybe-dispensed" && (
              <div className="p-6 rounded-[2rem] bg-emerald-600 text-white shadow-lg shadow-emerald-100 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <p className="text-lg font-black leading-tight">Vous êtes peut-être dispensé(e)</p>
                <p className="text-sm text-emerald-50 leading-relaxed">
                  D'après votre situation, une dispense de l'examen civique pourrait s'appliquer. La décision finale
                  revient à votre préfecture ou à l'administration en charge de votre dossier — vérifiez votre cas
                  avant de renoncer à vous préparer.
                </p>
                <a
                  href="https://www.service-public.gouv.fr/particuliers/vosdroits/F39530"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full h-12 bg-white text-emerald-700 hover:bg-emerald-50 font-black rounded-2xl text-sm gap-2">
                    Vérifier officiellement ma situation <ExternalLink size={14} />
                  </Button>
                </a>
                <Link href={buildHref("/examen-civique/entrainement")} className="block text-center text-xs font-black text-emerald-50 hover:underline pt-1">
                  Je préfère me préparer quand même →
                </Link>
              </div>
            )}

            {result === "not-concerned" && (
              <div className="p-6 rounded-[2rem] bg-zinc-900 text-white shadow-lg space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <XCircle size={20} />
                </div>
                <p className="text-lg font-black leading-tight">Vous n'êtes pas concerné(e)</p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  L'examen civique n'est exigé qu'une seule fois, lors de la première obtention du titre. Un
                  renouvellement n'est pas concerné.
                </p>
              </div>
            )}

            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed px-1">
              Ce test couvre les cas les plus fréquents, pas l'intégralité des situations (accords bilatéraux propres
              à certaines nationalités, cas mixtes...). Les règles peuvent évoluer : en cas de doute, vérifiez sur{" "}
              <a
                href="https://www.service-public.gouv.fr/particuliers/vosdroits/F39530"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:underline font-bold"
              >
                service-public.gouv.fr
              </a>{" "}
              ou avec votre préfecture.
            </p>

            <button
              onClick={reset}
              className="flex items-center gap-2 mx-auto text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-700"
            >
              <RotateCcw size={12} /> Recommencer le test
            </button>
          </div>
        )}

        {/* FAQ */}
        <div className="space-y-2 pt-4">
          <h2 className="text-base font-black text-zinc-900 px-1">Questions fréquentes</h2>
          <Accordion className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50 px-6">
            {faqItems.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-none">
                <AccordionTrigger className="hover:no-underline py-4 gap-4">
                  <span className="text-sm font-bold text-zinc-800 text-left">{item.q}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-0" hiddenUntilFound>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
