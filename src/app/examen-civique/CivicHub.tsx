"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCivicContext, DEFAULT_THEME } from "@/components/features/examen-civique/useCivicContext";
import { useShowCivicTefBridge } from "@/components/features/examen-civique/useShowCivicTefBridge";
import {
  MENTIONS,
  THEMES,
  MENTION_TO_LEVEL,
  EXAM_QUESTION_COUNT,
  EXAM_PASS_THRESHOLD,
  EXAM_STORAGE_KEY,
  mentionLabel,
} from "@/lib/civic-constants";
import { guideCategoryForMention, CIVIC_GENERAL_GUIDE_CATEGORY } from "@/lib/civic-guide-categories";
import {
  getLocalDueCount,
  getLocalAttempts,
  getLocalStats,
  getCivicStreakData,
  hasLocalCivicData,
  migrateLocalCivicDataToSupabase,
} from "@/lib/civic-local-store";
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
  Brain,
  Clock,
  ArrowRight,
  Landmark,
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
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
  const { mention, theme, setMention, setTheme, buildHref } = useCivicContext();

  const [civicStreak, setCivicStreak] = useState(0);
  const [localStats, setLocalStats] = useState({ seen: 0, mastered: 0, scheduled: 0 });
  const showCTATef = useShowCivicTefBridge();
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<CivicExamAttempt[]>([]);
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [mentionHelpOpen, setMentionHelpOpen] = useState(false);
  const [resumableExam, setResumableExam] = useState<{ mention: string; examEndAt: number } | null>(null);

  const hasDue = (dueCount ?? 0) > 0;
  const hasSeenQuestions = localStats.seen > 0;
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;

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
      .limit(5);
    setAttempts((data as CivicExamAttempt[]) || []);
  }, [supabase]);

  useEffect(() => { fetchDueCount(); fetchAttempts(); }, [fetchDueCount, fetchAttempts]);

  useEffect(() => {
    setCivicStreak(getCivicStreakData().currentStreak);
    setLocalStats(getLocalStats());
  }, []);

  // Un visiteur anonyme avait de la progression locale et vient de se connecter :
  // on la bascule vers Supabase avant qu'elle ne soit silencieusement perdue.
  useEffect(() => {
    if (!currentUser || !hasLocalCivicData()) return;
    migrateLocalCivicDataToSupabase(currentUser.id)
      .then(() => { fetchDueCount(); fetchAttempts(); setLocalStats(getLocalStats()); })
      .catch((err) => console.error("Error migrating local civic data:", err));
  }, [currentUser, fetchDueCount, fetchAttempts]);

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

  const relevantGuides = civicGuides
    .filter((g) => g.category === CIVIC_GENERAL_GUIDE_CATEGORY || g.category === guideCategoryForMention(mention))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-5 py-8 lg:px-6 space-y-6">

        {/* En-tête */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tighter leading-tight">
            Préparez votre examen civique
          </h1>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Obligatoire depuis janvier 2026 (carte de séjour pluriannuelle, carte de résident, naturalisation).
            {filteredCount !== null && <> {filteredCount} questions officielles disponibles.</>}
          </p>
        </div>

        {/* Réassurance */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl border border-zinc-100 p-3 text-center space-y-1">
            <p className="text-lg">🆓</p>
            <p className="text-[10px] font-black text-zinc-700 leading-tight">100 % gratuit</p>
            <p className="text-[9px] text-zinc-400 font-medium leading-tight">Sans inscription requise</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-100 p-3 text-center space-y-1">
            <p className="text-lg">🏛️</p>
            <p className="text-[10px] font-black text-zinc-700 leading-tight">Source officielle</p>
            <p className="text-[9px] text-zinc-400 font-medium leading-tight">Ministère de l'Intérieur</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-100 p-3 text-center space-y-1">
            <p className="text-lg">🧠</p>
            <p className="text-[10px] font-black text-zinc-700 leading-tight">Révision adaptative</p>
            <p className="text-[9px] text-zinc-400 font-medium leading-tight">L'algo s'adapte à vous</p>
          </div>
        </div>

        {/* Bannière examen interrompu */}
        {resumableExam && (
          <div className="p-5 rounded-[2rem] bg-amber-50 border-2 border-amber-200 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-black text-amber-900">Examen blanc en cours — {mentionLabel(resumableExam.mention)}</p>
              <p className="text-xs text-amber-700 font-medium">
                Il reste {formatTime(Math.max(0, Math.round((resumableExam.examEndAt - Date.now()) / 1000)))} avant la fin du temps imparti.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={abandonResumableExam} className="h-10 bg-white text-amber-700 font-black rounded-xl text-xs border border-amber-200">
                Abandonner
              </Button>
              <Link href="/examen-civique/examen-blanc?resume=1">
                <Button className="h-10 bg-amber-600 text-white font-black rounded-xl text-xs">Reprendre</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Votre démarche */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Landmark size={16} className="text-indigo-600" /> Votre démarche
            </h2>
            <button onClick={() => setMentionHelpOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">
              Cas particuliers / exemptions →
            </button>
          </div>
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5">
            <div className="grid grid-cols-3 gap-2">
              {MENTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMention(m.value)}
                  className={`py-3 px-2 rounded-2xl font-black text-xs transition-all leading-tight text-center ${mention === m.value ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"}`}
                >
                  <div>{m.label}</div>
                  {m.shortLabel && (
                    <div className={`text-[9px] font-bold normal-case tracking-normal mt-0.5 ${mention === m.value ? "text-indigo-200" : "text-zinc-400"}`}>
                      ({m.shortLabel})
                    </div>
                  )}
                  <div className={`text-[9px] font-black mt-1 ${mention === m.value ? "text-white" : "text-zinc-400"}`}>
                    Niveau {MENTION_TO_LEVEL[m.value]} (TEF IRN)
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Thématique */}
        <div className="space-y-2">
          <h2 className="text-base font-black text-zinc-900 px-1">Choisir une thématique</h2>
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 space-y-3">
            <p className="text-xs text-zinc-500 font-medium">
              Filtrez les questions par thème, ou travaillez sur toutes à la fois.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[DEFAULT_THEME, ...THEMES.map((t) => t.value)].map((val) => (
                <button
                  key={val}
                  onClick={() => setTheme(val)}
                  className={`px-3 h-7 rounded-xl font-black text-[10px] transition-all ${theme === val ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                >
                  {val === DEFAULT_THEME ? "Toutes" : THEMES.find((t) => t.value === val)?.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progression — toujours visible, même à 0 : ça rassure de savoir que c'est mesuré dès le départ */}
        <div className="space-y-2">
          <h2 className="text-base font-black text-zinc-900 px-1">Votre progression</h2>
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 space-y-5">
            {filteredCount !== null && filteredCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-black text-zinc-900">
                    {localStats.mastered} / {filteredCount} questions maîtrisées
                  </p>
                  <p className="text-xs font-black text-emerald-600">
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
                <p className="text-lg font-black text-orange-600">🔥 {civicStreak}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Jour{civicStreak > 1 ? "s" : ""} de suite</p>
              </div>
              <div className="text-center px-1">
                <p className="text-lg font-black text-zinc-900">
                  {bestScore !== null ? bestScore : "—"}
                  {bestScore !== null && <span className="text-xs text-zinc-400 font-bold">/{EXAM_QUESTION_COUNT}</span>}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Meilleur score</p>
              </div>
              <div className="text-center px-1">
                <p className={`text-lg font-black ${hasDue ? "text-indigo-600" : "text-zinc-300"}`}>{dueCount ?? 0}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">À réviser</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions — une seule carte "recommandée", pas trois de front */}
        <div className="space-y-2">
          <h2 className="text-base font-black text-zinc-900 px-1">Se préparer</h2>

          <div className="grid grid-cols-2 gap-2">
            {/* Action recommandée : Mémoriser si des révisions sont dues, sinon Apprendre */}
            <Link
              href={buildHref("/examen-civique/entrainement", { mode: hasDue ? "memoriser" : "apprendre" })}
              className="bg-indigo-600 rounded-[2rem] p-4 flex flex-col gap-3 hover:scale-[1.01] active:scale-[0.99] transition-transform relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <Brain size={19} className="text-white shrink-0" />
                <ArrowRight size={14} className="text-indigo-200 shrink-0" />
              </div>
              <div>
                <p className="text-sm font-black text-white leading-tight">
                  {hasDue ? "Mémoriser" : "Apprendre"}
                </p>
                <p className="text-[11px] text-indigo-200 font-medium mt-1 leading-snug">
                  {hasDue
                    ? `${dueCount} révision${dueCount! > 1 ? "s" : ""} prévue${dueCount! > 1 ? "s" : ""}`
                    : "Nouvelles questions, réponse testée immédiatement."}
                </p>
              </div>
            </Link>

            {/* Parcourir — neutre, utilitaire */}
            <Link
              href={buildHref("/examen-civique/parcourir")}
              className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-4 flex flex-col gap-3 hover:border-zinc-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                  <BookOpen size={15} className="text-zinc-500" />
                </div>
                <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-600 shrink-0 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-black text-zinc-900 leading-tight">Parcourir</p>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 leading-snug">
                  Toutes les Q&amp;R avec explication et source.
                </p>
              </div>
            </Link>
          </div>

          {/* Examen blanc — neutre aussi : seul le badge d'icône signale le format formel/chronométré */}
          <Link
            href={buildHref("/examen-civique/examen-blanc")}
            className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 flex items-start gap-3 hover:border-zinc-200 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
              <Clock size={17} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-zinc-900">Examen blanc</p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
                {EXAM_QUESTION_COUNT} questions, 45 minutes, conditions réelles. Seuil de réussite : {EXAM_PASS_THRESHOLD}/{EXAM_QUESTION_COUNT}.
                {bestScore !== null && <span className="text-zinc-400"> Votre meilleur : {bestScore}/{EXAM_QUESTION_COUNT}.</span>}
              </p>
            </div>
            <ArrowRight size={15} className="text-zinc-300 group-hover:text-zinc-600 shrink-0 mt-1 transition-colors" />
          </Link>
        </div>

        {/* Historique récent */}
        {attempts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-base font-black text-zinc-900 px-1">Derniers examens blancs</h2>
            <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
              {attempts.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                      {a.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-900">
                        {a.score}/{a.total_questions}
                        <span className="ml-2 text-zinc-400 font-bold text-xs">{mentionLabel(a.mention)}</span>
                      </p>
                      <p className="text-[10px] font-bold text-zinc-400">{formatAttemptDate(a.created_at)}</p>
                    </div>
                  </div>
                  <Badge className={`border-none rounded-full px-3 py-1 text-[10px] font-black uppercase ${a.passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                    {a.passed ? "Réussi" : "Échoué"}
                  </Badge>
                </div>
              ))}
            </div>
            <Link href={buildHref("/examen-civique/examen-blanc")} className="block w-full text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-700 py-1 transition-colors">
              Voir l'historique complet →
            </Link>
          </div>
        )}

        {/* Séparateur — le pont TEF IRN n'est pas une étape de "Se préparer", c'est un aparté */}
        <div className="pt-2 border-t border-zinc-200" />

        {/* Pont LlamaKusi — visible dès le sommaire, pas seulement en fin de session */}
        {showCTATef && (
          <div className="p-6 rounded-[2rem] bg-indigo-600 space-y-3">
            <p className="text-sm font-black text-white">Vous préparez aussi votre niveau de français ?</p>
            <p className="text-xs text-indigo-200 font-medium leading-relaxed">
              Votre démarche {mentionLabel(mention)} exige le niveau {MENTION_TO_LEVEL[mention]} au TEF IRN.
              LlamaKusi propose un coach IA oral &amp; écrit et des exercices adaptatifs — dès 55 €/mois.
            </p>
            <Link href={currentUser ? "/tef-irn/dashboard" : "/tef-irn/login?from=examen_civique_hub"}>
              <Button className="h-10 px-4 bg-white text-indigo-700 rounded-2xl font-black text-xs hover:bg-indigo-50">
                Découvrir LlamaKusi <ArrowRight className="ml-2" size={14} />
              </Button>
            </Link>
          </div>
        )}

        {/* Séparateur — referme l'aparté TEF IRN avant d'enchaîner sur les guides/FAQ */}
        <div className="pt-2 border-t border-zinc-200" />

        {/* Guides — teaser filtré par démarche, catalogue complet sur sa propre page */}
        {relevantGuides.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" /> Pour aller plus loin
              </h2>
              <Link href="/examen-civique/guides" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">
                Tous les guides →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {relevantGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/tef-irn/guides/${g.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 hover:border-indigo-200 transition-all block"
                >
                  <p className="text-sm font-black text-zinc-900 leading-tight">{g.title}</p>
                  {g.description && <p className="text-xs text-zinc-500 font-medium mt-1 line-clamp-2 leading-relaxed">{g.description}</p>}
                  {g.reading_time && <p className="text-[10px] font-bold text-zinc-400 mt-2">{g.reading_time} min de lecture</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="space-y-2">
          <h2 className="text-base font-black text-zinc-900 px-1">Questions fréquentes</h2>
          <Accordion className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50 px-6">
            {faq.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-none">
                <AccordionTrigger className="hover:no-underline py-4 gap-4">
                  <span className="text-sm font-bold text-zinc-800 text-left">{item.q}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-0">
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <Dialog open={mentionHelpOpen} onOpenChange={setMentionHelpOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cas particuliers et exemptions</DialogTitle>
            <DialogDescription>
              Depuis le 1er janvier 2026, l'examen civique est obligatoire pour toute <strong>première</strong> demande de carte de séjour pluriannuelle (CSP), de carte de résident (CR) ou de naturalisation par décret. Un simple <strong>renouvellement</strong> d'un titre déjà détenu n'est jamais concerné : l'examen n'est exigé qu'une seule fois, à la première obtention.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-zinc-50 space-y-2">
              <p className="text-lg font-semibold text-zinc-900 leading-none tracking-tight">Dispenses les plus courantes</p>
              <ul className="text-sm text-zinc-500 leading-relaxed space-y-1.5 list-disc pl-4">
                <li>Bénéficiaires de la protection internationale (réfugiés, protection subsidiaire, apatrides).</li>
                <li>Personnes âgées de 65 ans ou plus à la date de la demande.</li>
                <li>Ressortissants de pays liés à la France par un accord bilatéral spécifique prévoyant un régime différent (par exemple l'accord franco-algérien du 27 décembre 1968).</li>
                <li>Situation médicale ou handicap rendant l'évaluation impossible — dispense examinée au cas par cas par l'administration, sur justificatif.</li>
              </ul>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 space-y-2">
              <p className="text-lg font-semibold text-zinc-900 leading-none tracking-tight">Pour la naturalisation</p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Les dispenses sont plus limitées que pour les titres de séjour : en pratique, c'est surtout la dispense médicale/handicap qui s'applique. L'examen civique ne remplace pas l'entretien en préfecture, qui reste nécessaire.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cette liste couvre les cas les plus fréquents, pas l'intégralité des situations (accords bilatéraux propres à certaines nationalités, cas mixtes...). Les règles peuvent évoluer. En cas de doute sur votre situation personnelle, vérifiez sur{" "}
            <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F39530" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-bold">
              service-public.gouv.fr
            </a>{" "}
            ou avec votre préfecture.
          </p>
          <DialogFooter>
            <Button onClick={() => setMentionHelpOpen(false)} className="bg-zinc-900 text-white rounded-2xl font-black text-sm">
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
