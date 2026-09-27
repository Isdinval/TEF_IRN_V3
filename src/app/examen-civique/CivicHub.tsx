"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCivicContext, DEFAULT_THEME } from "@/components/features/examen-civique/useCivicContext";
import { useShowCivicTefBridge } from "@/components/features/examen-civique/useShowCivicTefBridge";
import { InfoTooltip } from "@/components/features/examen-civique/InfoTooltip";
import { captureEvent } from "@/lib/analytics";
import {
  MENTIONS,
  MENTION_TO_LEVEL,
  EXAM_QUESTION_COUNT,
  EXAM_DURATION_SECONDS,
  EXAM_PASS_THRESHOLD,
  EXAM_STORAGE_KEY,
  mentionLabel,
} from "@/lib/civic-constants";
import { guideCategoryForMention, CIVIC_GENERAL_GUIDE_CATEGORY } from "@/lib/civic-guide-categories";
import { useCoachContext } from "@/contexts/CoachContext";
import {
  getLocalDueCount,
  getLocalAttempts,
  getLocalStats,
  getCivicStreakData,
  hasLocalCivicData,
  migrateLocalCivicDataToSupabase,
} from "@/lib/civic-local-store";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  Loader2,
  Clock,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
} from "lucide-react";
import type { Guide } from "@/types/guides";

interface CivicExamAttempt {
  id: string;
  mention: string;
  score: number;
  total_questions: number;
  passed: boolean;
  duration_seconds: number | null;
  created_at: string;
}

interface CivicHubProps {
  civicGuides: Guide[];
  faq: { q: string; a: string }[];
}

function formatAttemptDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CivicHubContent({ civicGuides, faq }: CivicHubProps) {
  const supabase = useMemo(() => createClient(), []);
  const { user: currentUser } = useAuth();
  const { mention, theme, setMention, buildHref } = useCivicContext();
  const { setPageContext } = useCoachContext();

  const [civicStreak, setCivicStreak] = useState(0);
  const [localStats, setLocalStats] = useState({ seen: 0, mastered: 0, scheduled: 0 });
  const showCTATef = useShowCivicTefBridge();
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<CivicExamAttempt[]>([]);
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [mentionHelpOpen, setMentionHelpOpen] = useState(false);
  const mentionHelpScrollRef = useRef<HTMLDivElement>(null);
  const [showAllAttempts, setShowAllAttempts] = useState(false);
  const [resumableExam, setResumableExam] = useState<{ mention: string; examEndAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const hasDue = (dueCount ?? 0) > 0;
  const hasSeenQuestions = localStats.seen > 0;
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
  // attempts est trié du plus récent au plus ancien (Supabase: order desc ; local store:
  // unshift), donc les 5 premiers sont bien les 5 derniers examens blancs passés.
  const last5 = attempts.slice(0, 5);
  const last5Count = last5.length;
  const last5Average = last5Count > 0 ? Math.round(last5.reduce((sum, a) => sum + a.score, 0) / last5Count) : null;
  const isExamReady = last5Average !== null && last5Average >= EXAM_PASS_THRESHOLD;

  // Mesure la traction réelle du hub Examen Civique (item 2 du plan MoSCoW
  // "Valorisation & instrumentation Examen Civique") — aucune vue n'était
  // mesurée avant ce jour sur ce produit.
  useEffect(() => {
    captureEvent("civic_page_viewed", { page: "hub" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPageContext({
      type: "civic",
      page: "hub",
      mention,
      dueCount: dueCount ?? undefined,
      masteredCount: localStats.mastered,
      bestScore,
    });
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mention, dueCount, localStats.mastered, bestScore]);

  const fetchDueCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDueCount(getLocalDueCount()); return; }
    const { count } = await supabase
      .from("user_civic_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString());
    setDueCount(count || 0);
  }, [supabase]);

  const fetchAttempts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAttempts(getLocalAttempts()); return; }
    const { data } = await supabase
      .from("civic_exam_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setAttempts((data as CivicExamAttempt[]) || []);
  }, [supabase]);

  // "mastered" suit la même définition que dans /parcourir (consecutive_correct >= 2).
  // Corrige un bug où localStats restait toujours lu depuis le localStorage, y compris
  // pour un utilisateur connecté dont la vraie progression vit dans user_civic_reviews.
  const fetchMasteryStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLocalStats(getLocalStats()); return; }
    const [{ count: seenCount }, { count: masteredCount }] = await Promise.all([
      supabase.from("user_civic_reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("user_civic_reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("consecutive_correct", 2),
    ]);
    setLocalStats({ seen: seenCount || 0, mastered: masteredCount || 0, scheduled: 0 });
  }, [supabase]);

  useEffect(() => { fetchDueCount(); fetchAttempts(); }, [fetchDueCount, fetchAttempts]);

  useEffect(() => {
    setCivicStreak(getCivicStreakData().currentStreak);
    fetchMasteryStats();
  }, [fetchMasteryStats]);

  // Un visiteur anonyme avait de la progression locale et vient de se connecter :
  // on la bascule vers Supabase avant qu'elle ne soit silencieusement perdue.
  useEffect(() => {
    if (!currentUser || !hasLocalCivicData()) return;
    migrateLocalCivicDataToSupabase(currentUser.id)
      .then(() => { fetchDueCount(); fetchAttempts(); fetchMasteryStats(); })
      .catch((err) => console.error("Error migrating local civic data:", err));
  }, [currentUser, fetchDueCount, fetchAttempts, fetchMasteryStats]);

  // Compte les questions disponibles pour la démarche + thématique sélectionnées.
  useEffect(() => {
    let active = true;
    (async () => {
      let query = supabase.from("civic_questions").select("id", { count: "exact", head: true });
      query = query.contains("mentions", [mention]);
      if (theme !== DEFAULT_THEME) query = query.eq("theme", theme);
      const { count } = await query;
      if (active) setFilteredCount(count ?? null);
    })();
    return () => { active = false; };
  }, [mention, theme, supabase]);

  // Détecte un examen blanc interrompu (refresh, crash d'onglet...) pour proposer de reprendre.
  // La logique complète de reprise / soumission automatique vit dans /examen-blanc.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(EXAM_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved?.examEndAt && Date.now() < saved.examEndAt) {
        setResumableExam({ mention: saved.mention, examEndAt: saved.examEndAt });
      }
    } catch {
      window.localStorage.removeItem(EXAM_STORAGE_KEY);
    }
  }, []);

  const abandonResumableExam = () => {
    window.localStorage.removeItem(EXAM_STORAGE_KEY);
    setResumableExam(null);
  };

  // Fait défiler le compte à rebours affiché dans la bannière "examen en cours"
  // (sinon il restait figé jusqu'au prochain refresh de la page).
  useEffect(() => {
    if (!resumableExam) return;
    const interval = setInterval(() => {
      const t = Date.now();
      if (t >= resumableExam.examEndAt) {
        window.localStorage.removeItem(EXAM_STORAGE_KEY);
        setResumableExam(null);
        return;
      }
      setNow(t);
    }, 1000);
    return () => clearInterval(interval);
  }, [resumableExam]);

  const nextStep = resumableExam
    ? {
        href: "/examen-civique/examen-blanc?resume=1",
        title: `Reprendre votre examen blanc — ${mentionLabel(resumableExam.mention)}`,
        description: `Il reste ${formatTime(Math.max(0, Math.round((resumableExam.examEndAt - now) / 1000)))} avant la fin du temps imparti.`,
        cta: "Reprendre",
      }
    : hasDue
      ? {
          href: buildHref("/examen-civique/entrainement", { mode: "memoriser" }),
          title: `Mémoriser : ${dueCount} révision${dueCount! > 1 ? "s" : ""} prévue${dueCount! > 1 ? "s" : ""}`,
          description: "Ces questions déjà vues arrivent à leur date de révision : c'est le meilleur moment pour les ancrer durablement.",
          cta: "Réviser",
        }
      : {
          href: buildHref("/examen-civique/entrainement", { mode: "apprendre" }),
          title: hasSeenQuestions ? "Apprendre de nouvelles questions" : "Commencez votre entraînement",
          description: "Une question à la fois, avec correction immédiate et explication.",
          cta: hasSeenQuestions ? "Continuer" : "Commencer",
        };

  const relevantGuides = civicGuides
    .filter((g) => g.category === CIVIC_GENERAL_GUIDE_CATEGORY || g.category === guideCategoryForMention(mention))
    .slice(0, 4);

  const plusLoinContent = (
    <>
      {/* Pont LlamaKusi */}
      {showCTATef && (
        <div className="p-6 rounded-3xl bg-indigo-600 space-y-3">
          <p className="text-sm font-black text-white">Vous préparez aussi votre niveau de français ?</p>
          <p className="text-sm text-indigo-200 font-medium leading-relaxed">
            Votre démarche {mentionLabel(mention)} exige le niveau {MENTION_TO_LEVEL[mention]} au TEF IRN.
            LlamaKusi propose un coach IA oral &amp; écrit et des exercices adaptatifs — dès 32,90 €/mois.
          </p>
          <Link
            href={currentUser ? "/tef-irn/dashboard" : "/tef-irn/login?from=examen_civique_hub"}
            onClick={() => captureEvent("civic_bridge_cta_clicked", { page: "hub", cta: "decouvrir_llamakusi" })}
          >
            <Button className="h-11 px-4 bg-white text-indigo-700 rounded-2xl font-black text-sm hover:bg-indigo-50">
              Découvrir LlamaKusi <ArrowRight className="ml-2" size={14} />
            </Button>
          </Link>
        </div>
      )}

      {/* Guides — teaser filtré par démarche, catalogue complet sur sa propre page */}
      {relevantGuides.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-zinc-900">Guides</h3>
            <Link href="/examen-civique/guides" className="text-xs font-black uppercase tracking-widest text-indigo-500 hover:underline">
              Tous les guides →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {relevantGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/examen-civique/guides/${g.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 hover:border-indigo-200 transition-all block"
              >
                <p className="text-sm font-black text-zinc-900 leading-tight">{g.title}</p>
                {g.description && <p className="text-sm text-zinc-500 font-medium mt-1 line-clamp-2 leading-relaxed">{g.description}</p>}
                {g.reading_time && <p className="text-sm font-bold text-zinc-500 mt-2">{g.reading_time} min de lecture</p>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="space-y-2">
        <h3 className="text-sm font-black text-zinc-900 px-1">Questions fréquentes</h3>
        <Accordion className="bg-zinc-50 rounded-3xl border border-zinc-100 divide-y divide-zinc-100 px-6">
          {faq.map((item) => (
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
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-5 py-8 lg:px-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
        <div className="space-y-6 lg:col-span-2">

        <ExerciseLayout
          title={<>Préparez votre <span className="text-indigo-600">examen civique</span></>}
          badge="100 % gratuit"
          description={`Obligatoire depuis janvier 2026 (carte de séjour pluriannuelle, carte de résident, naturalisation).${filteredCount !== null ? ` ${filteredCount} questions officielles disponibles.` : ""}`}
        >
          {/* L'examen en bref — les faits clés lisibles en 5 secondes, puis la réassurance. */}
          <div className="space-y-3">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Format", value: `${EXAM_QUESTION_COUNT} questions`, detail: "QCM" },
                { label: "Durée", value: `${EXAM_DURATION_SECONDS / 60} min`, detail: "Chronométré" },
                { label: "Pour réussir", value: `${EXAM_PASS_THRESHOLD}/${EXAM_QUESTION_COUNT}`, detail: `Soit ${Math.round((EXAM_PASS_THRESHOLD / EXAM_QUESTION_COUNT) * 100)} %` },
                { label: "Lieu", value: "Centre agréé", detail: "Jamais en ligne" },
              ].map((f) => (
                <div key={f.label} className="bg-white rounded-2xl border border-zinc-100 p-3">
                  <dt className="text-xs font-black uppercase tracking-widest text-zinc-500">{f.label}</dt>
                  <dd className="text-lg font-black text-zinc-900 leading-tight mt-1">{f.value}</dd>
                  <dd className="text-sm text-zinc-500 font-medium">{f.detail}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-zinc-600 font-medium leading-relaxed">
              100 % gratuit, sans inscription · Questions officielles du Ministère de l&apos;Intérieur · Révision adaptative qui s&apos;ajuste à vous
            </p>
          </div>
        </ExerciseLayout>

        {/* Prochaine étape — une seule carte mise en avant (design system §6.3), qui dépend
            de l'état de l'apprenant : examen blanc interrompu > révisions dues > nouvelles
            questions. Fusionne l'ancienne bannière de reprise et l'ancienne carte « Apprendre /
            Mémoriser » de la section Se préparer. */}
        <section aria-labelledby="prochaine-etape" className="rounded-3xl border-2 border-indigo-600 bg-indigo-50/60 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Prochaine étape</p>
            <h2 id="prochaine-etape" className="text-lg font-black text-zinc-900">{nextStep.title}</h2>
            <p className="text-sm text-zinc-600 font-medium leading-relaxed">{nextStep.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={nextStep.href}
              className="inline-flex h-11 items-center rounded-full bg-indigo-600 px-8 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
            >
              {nextStep.cta} <ArrowRight className="ml-2" size={14} />
            </Link>
            {resumableExam && (
              <Button variant="outline" onClick={abandonResumableExam} className="h-11 rounded-2xl font-bold bg-white">
                Abandonner cet examen
              </Button>
            )}
          </div>
        </section>

        {/* Démarche — contexte de toute la page (questions comptées, guides, niveau de
            français requis) : choisie directement ici plutôt que seulement affichée. */}
        <section aria-labelledby="demarche-titre" className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 space-y-4">
          <h2 id="demarche-titre" className="flex items-center gap-2 text-lg font-black text-zinc-900">
            <Badge className="bg-violet-600 text-white rounded-full">Démarche</Badge> Pour quelle demande ?
          </h2>
          <div role="group" aria-label="Choisir votre démarche" className="grid grid-cols-3 gap-2">
            {MENTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-pressed={mention === m.value}
                onClick={() => setMention(m.value)}
                className={`min-h-12 px-2 py-2 rounded-2xl font-black text-sm leading-tight transition-all ${mention === m.value ? "bg-indigo-600 text-white shadow-lg" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"}`}
              >
                <span className="sm:hidden">{m.shortLabel ?? m.label}</span>
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-zinc-600 font-medium">
            <span className="font-black text-zinc-900">{mentionLabel(mention)}</span>
            {MENTION_TO_LEVEL[mention] && <> · Niveau de français requis : <span className="font-black text-zinc-900">{MENTION_TO_LEVEL[mention]}</span></>}
          </p>
          <div className="flex items-center gap-x-6 gap-y-1 flex-wrap">
            <Link href="/examen-civique/eligibilite" className="inline-flex min-h-11 items-center text-sm font-black text-indigo-600 hover:underline">
              Suis-je concerné ? Faire le test <ArrowRight className="ml-1" size={14} />
            </Link>
            <button type="button" onClick={() => setMentionHelpOpen(true)} className="inline-flex min-h-11 items-center text-sm font-bold text-zinc-500 hover:underline">
              Cas particuliers et exemptions
            </button>
          </div>
        </section>

        {/* Progression — toujours visible, même à 0 : ça rassure de savoir que c'est mesuré dès le départ */}
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-black text-zinc-900 px-1">
            <Badge className="bg-emerald-600 text-white rounded-full">Progression</Badge> Votre progression
          </h2>
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-5 space-y-5">
            {filteredCount !== null && filteredCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-black text-zinc-900">
                    {localStats.mastered} / {filteredCount} questions maîtrisées
                    <InfoTooltip text="Une question est « maîtrisée » après plusieurs révisions consécutives réussies (méthode de répétition espacée). Le total dépend de votre démarche et thématique actuelles." />
                  </p>
                  <p className="text-sm font-black text-emerald-600">
                    {Math.round((localStats.mastered / filteredCount) * 100)}%
                  </p>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((localStats.mastered / filteredCount) * 100))}%` }}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 divide-x divide-zinc-100">
              <div className="text-center px-1">
                <p className="text-lg font-black text-amber-600">🔥 {civicStreak}</p>
                <p className="flex items-center justify-center gap-1 text-xs font-black uppercase tracking-widest text-zinc-500 mt-0.5">
                  Jour{civicStreak > 1 ? "s" : ""} de suite
                  <InfoTooltip text="Nombre de jours consécutifs où vous avez pratiqué au moins une question (entraînement ou examen blanc)." />
                </p>
              </div>
              <div className="text-center px-1">
                <p className="text-lg font-black text-zinc-900">
                  {bestScore !== null ? bestScore : "—"}
                  {bestScore !== null && <span className="text-sm text-zinc-500 font-bold">/{EXAM_QUESTION_COUNT}</span>}
                </p>
                <p className="flex items-center justify-center gap-1 text-xs font-black uppercase tracking-widest text-zinc-500 mt-0.5">
                  Meilleur score
                  <InfoTooltip text={`Votre meilleur résultat parmi tous vos examens blancs passés, sur ${EXAM_QUESTION_COUNT} questions. Seuil de réussite : ${EXAM_PASS_THRESHOLD}/${EXAM_QUESTION_COUNT}.`} />
                </p>
              </div>
              <div className="text-center px-1">
                <p className={`text-lg font-black ${hasDue ? "text-indigo-600" : "text-zinc-500"}`}>{dueCount ?? 0}</p>
                <p className="flex items-center justify-center gap-1 text-xs font-black uppercase tracking-widest text-zinc-500 mt-0.5">
                  À réviser
                  <InfoTooltip text="Questions déjà vues dont la date de révision (répétition espacée) est arrivée aujourd'hui. Les revoir maintenant les ancre plus durablement en mémoire." />
                </p>
              </div>
            </div>

            {last5Average !== null && (
              <div className={`rounded-2xl p-4 flex items-center justify-between gap-3 ${isExamReady ? "bg-emerald-50" : "bg-amber-50"}`}>
                <div>
                  <p className={`text-sm font-black ${isExamReady ? "text-emerald-700" : "text-amber-700"}`}>
                    {isExamReady ? "Vous êtes prêt pour l'examen 🎉" : "Continuez à vous entraîner"}
                  </p>
                  <p className="text-sm text-zinc-500 font-medium mt-0.5">
                    Moyenne sur {last5Count === 1 ? "votre dernier examen blanc" : `vos ${last5Count} derniers examens blancs`} : {last5Average}/{EXAM_QUESTION_COUNT}
                  </p>
                </div>
                <InfoTooltip
                  className={isExamReady ? "text-emerald-400 hover:text-emerald-700" : "text-amber-400 hover:text-amber-700"}
                  text={`Seuil de réussite officiel : ${EXAM_PASS_THRESHOLD}/${EXAM_QUESTION_COUNT}. Une moyenne récente est un signal plus fiable qu'un seul meilleur score, qui peut être un coup de chance.`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions — 2 sous-sections distinctes : Entraînement (la boucle réelle de
            préparation, forme testée) et Ressources complémentaires (lecture de fond +
            logistique, utiles mais non indispensables). Pas de badges numérotés : plus
            aucun de ces éléments n'est une étape obligatoire dans un ordre imposé. */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-black text-zinc-900 px-1">
            <Badge className="bg-indigo-600 text-white rounded-full">Étapes</Badge> Se préparer
          </h2>

          {/* Sous-section : Entraînement — la boucle testée (apprendre/mémoriser,
              consulter, se tester), celle que le produit recommande activement. */}
          <div className="space-y-2">
            <p className="px-1 text-xs font-black uppercase tracking-widest text-zinc-500">Entraînement</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Parcourir — neutre, utilitaire */}
              <Link
                href={buildHref("/examen-civique/parcourir")}
                className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-4 flex flex-col gap-2.5 hover:border-zinc-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <BookOpen size={15} className="text-zinc-500" />
                  </div>
                  <ArrowRight size={14} className="text-zinc-500 group-hover:text-zinc-600 shrink-0 transition-colors" />
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-black text-zinc-900 leading-tight">
                    Parcourir
                    <span className="relative z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <InfoTooltip text="Consultez librement toutes les questions-réponses du référentiel, sans être testé — utile pour réviser un point précis." />
                    </span>
                  </p>
                  <p className="text-sm text-zinc-500 font-medium mt-1 leading-snug">
                    Toutes les Q&amp;R avec explication et source.
                  </p>
                </div>
              </Link>

              {/* Examen blanc — icône sombre pour signaler le format formel/chronométré */}
              <Link
                href={buildHref("/examen-civique/examen-blanc")}
                className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-4 flex flex-col gap-2.5 hover:border-zinc-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0">
                    <Clock size={15} className="text-white" />
                  </div>
                  <ArrowRight size={14} className="text-zinc-500 group-hover:text-zinc-600 shrink-0 transition-colors" />
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-black text-zinc-900 leading-tight">
                    Examen blanc
                    <span className="relative z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <InfoTooltip text="Simulation chronométrée dans les conditions réelles de l'examen officiel : mêmes règles, même seuil de réussite." />
                    </span>
                  </p>
                  <p className="text-sm text-zinc-500 font-medium mt-1 leading-snug">
                    {EXAM_QUESTION_COUNT} questions, 45 min · Seuil {EXAM_PASS_THRESHOLD}/{EXAM_QUESTION_COUNT}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Sous-section : Ressources complémentaires — pertinentes mais non
              indispensables pour se préparer (lecture de fond, logistique du jour J). */}
          <div className="space-y-2">
            <p className="px-1 text-xs font-black uppercase tracking-widest text-zinc-500">Ressources complémentaires</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Livret du citoyen — lecture de fond recommandée, pas une étape obligatoire */}
              <Link
                href="/examen-civique/livret"
                className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-4 flex flex-col gap-2.5 hover:border-zinc-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <BookOpen size={15} className="text-indigo-600" />
                  </div>
                  <ArrowRight size={14} className="text-zinc-500 group-hover:text-zinc-600 shrink-0 transition-colors" />
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-black text-zinc-900 leading-tight">
                    Livret du citoyen 2026
                    <span className="relative z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <InfoTooltip text="Le support de révision officiel : toutes les connaissances attendues à l'examen, organisées par thématique. Une lecture utile, mais pas indispensable pour commencer à vous entraîner." />
                    </span>
                  </p>
                  <p className="text-sm text-zinc-500 font-medium mt-1 leading-snug">
                    Référentiel officiel du Ministère de l&apos;Intérieur. Gratuit, PDF téléchargeable.
                  </p>
                </div>
              </Link>

              {/* Centres d'examen — logistique du jour J, pas de contexte démarche/thème à propager */}
              <Link
                href="/examen-civique/centres"
                className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-4 flex flex-col gap-2.5 hover:border-zinc-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <MapPin size={15} className="text-zinc-500" />
                  </div>
                  <ArrowRight size={14} className="text-zinc-500 group-hover:text-zinc-600 shrink-0 transition-colors" />
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-black text-zinc-900 leading-tight">
                    Centres d&apos;examen
                    <span className="relative z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <InfoTooltip text="L'examen se passe uniquement dans un centre agréé par une Chambre de Commerce et d'Industrie (CCI), jamais en ligne ni à domicile." />
                    </span>
                  </p>
                  <p className="text-sm text-zinc-500 font-medium mt-1 leading-snug">
                    Centres agréés CCI, adresse et contact.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Historique récent — toujours visible, même vide : ça indique qu'un historique
            existera après un premier examen blanc plutôt que de faire disparaître la section. */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-lg font-black text-zinc-900">
              <Badge className="bg-zinc-900 text-white rounded-full">Historique</Badge> Derniers examens blancs
            </h2>
            {attempts.length > 3 && (
              <button
                onClick={() => setShowAllAttempts((prev) => !prev)}
                className="text-xs font-black uppercase tracking-widest text-indigo-500 hover:underline"
              >
                {showAllAttempts ? "Voir moins" : "Voir l'historique complet"} →
              </button>
            )}
          </div>
          {attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-10 text-center">
              <Clock size={32} className="text-zinc-500" />
              <p className="text-sm font-bold text-zinc-500">Aucun examen blanc pour l'instant.</p>
              <p className="text-sm text-zinc-500">Vos résultats apparaîtront ici après votre premier examen blanc.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm divide-y divide-zinc-50">
              {(showAllAttempts ? attempts : attempts.slice(0, 3)).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${a.passed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                      {a.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-900">
                        {a.score}/{a.total_questions}
                        <span className="ml-2 text-zinc-500 font-bold text-sm">{mentionLabel(a.mention)}</span>
                      </p>
                      <p className="text-sm font-bold text-zinc-500">{formatAttemptDate(a.created_at)}</p>
                    </div>
                  </div>
                  <Badge className={`border-none rounded-full px-3 py-1 text-xs font-black uppercase ${a.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {a.passed ? "Réussi" : "Échoué"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          </div>

        {/* Séparateur — tout ce qui suit est secondaire (conversion, approfondissement).
            Sur mobile : accordéon replié pour ne pas alourdir le scroll. Sur desktop
            (lg:hidden ici), ce même contenu vit en colonne latérale persistante --
            voir plus bas, hors de cette colonne principale. */}
        <div className="pt-2 border-t border-zinc-200 lg:hidden" />

        <Accordion className="bg-white rounded-3xl border border-zinc-100 shadow-sm px-6 lg:hidden">
          <AccordionItem value="plus-loin" className="border-none">
            <AccordionTrigger className="hover:no-underline py-4 gap-4">
              <span className="flex items-center gap-2 text-sm font-black text-zinc-900">
                <Sparkles size={16} className="text-indigo-400" /> Pour aller plus loin
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-6 pl-0 space-y-6" hiddenUntilFound>
              {plusLoinContent}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </div>

        {/* Colonne latérale — desktop uniquement (lg:), remplit l'espace laissé vide
            par la colonne principale sur grand écran avec du contenu réel plutôt que
            du padding. Même contenu que l'accordéon mobile ci-dessus, toujours visible
            ici puisque l'espace ne manque pas. */}
        <div className="hidden lg:block lg:sticky lg:top-8 space-y-6 bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-sm font-black text-zinc-900">
            <Sparkles size={16} className="text-indigo-400" /> Pour aller plus loin
          </h3>
          {plusLoinContent}
        </div>
      </div>

      <Dialog open={mentionHelpOpen} onOpenChange={setMentionHelpOpen}>
        <DialogContent
          className="max-w-lg max-h-[85vh] flex flex-col p-0"
          initialFocus={mentionHelpScrollRef}
        >
          <div ref={mentionHelpScrollRef} tabIndex={-1} className="overflow-y-auto p-6 space-y-4 outline-none">
            <DialogHeader>
              <DialogTitle>Cas particuliers et exemptions</DialogTitle>
              <DialogDescription>
                Depuis le 1er janvier 2026, l'examen civique est obligatoire pour toute <strong>première</strong> demande de carte de séjour pluriannuelle (CSP), de carte de résident (CR) ou de naturalisation par décret. Un simple <strong>renouvellement</strong> d'un titre déjà détenu n'est jamais concerné : l'examen n'est exigé qu'une seule fois, à la première obtention.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-50 space-y-2">
                <p className="text-lg font-bold text-zinc-900 leading-none tracking-tight">Pour la CSP</p>
                <ul className="text-sm text-zinc-500 leading-relaxed space-y-1.5 list-disc pl-4">
                  <li>Titres non soumis au contrat d'intégration républicaine, bénéficiaires de la protection subsidiaire et apatrides (avec leur famille) : hors champ de l'examen.</li>
                  <li>65 ans ou plus à la date de la demande : dispense.</li>
                  <li>Situation médicale ou handicap rendant l'évaluation impossible : dispense sur certificat médical, au cas par cas.</li>
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 space-y-2">
                <p className="text-lg font-bold text-zinc-900 leading-none tracking-tight">Pour la carte de résident</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  65 ans ou plus, ou situation médicale/handicap (mêmes règles que pour la CSP). Attention : contrairement à la CSP, les bénéficiaires d'une carte de réfugié ou de protection subsidiaire demandant une carte de résident longue durée-UE sont concernés par l'examen, pas dispensés.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 space-y-2">
                <p className="text-lg font-bold text-zinc-900 leading-none tracking-tight">Pour la naturalisation</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Aucune dispense d'âge ni liée à un accord bilatéral : seule la dispense médicale/handicap s'applique. L'examen civique ne remplace pas l'entretien en préfecture, qui reste nécessaire.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le cas des accords bilatéraux spécifiques (par exemple l'accord franco-algérien du 27 décembre 1968) fait actuellement l'objet d'interprétations divergentes selon les préfectures : ne vous fiez pas à une dispense automatique, vérifiez votre situation exacte avant votre demande. Cette liste couvre les cas les plus fréquents, pas l'intégralité des situations. Les règles peuvent évoluer. En cas de doute, vérifiez sur{" "}
              <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F39530" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-bold">
                service-public.gouv.fr
              </a>{" "}
              ou avec votre préfecture.
            </p>
            <Link href="/examen-civique/eligibilite" className="block text-sm font-black text-indigo-600 hover:underline">
              Faire le test d'éligibilité complet →
            </Link>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-zinc-100">
            <Button onClick={() => setMentionHelpOpen(false)} className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl text-sm shadow-lg shadow-indigo-200">
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CivicHub(props: CivicHubProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <CivicHubContent {...props} />
    </Suspense>
  );
}
