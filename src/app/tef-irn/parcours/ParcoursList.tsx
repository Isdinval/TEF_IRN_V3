"use client";

import { useState } from "react";
import Link from "next/link";
import { AlignLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, Clock, Languages, Sparkles } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Parcours, ParcoursExerciseStats, ParcoursProgress } from "@/lib/parcours";
import { PageTransition } from "@/components/shared/Animations";

export interface ParcoursWithProgress extends Parcours {
  progress?: ParcoursProgress;
  lessonCount?: number;
  nextLesson?: { slug: string; title: string } | null;
  exerciseStats?: ParcoursExerciseStats | null;
}

// Catégorie = icône neutre, jamais une couleur (seul l'indigo porte l'état).
const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  conjugaison: Clock,
  grammaire: BookOpen,
  syntaxe: AlignLeft,
  vocabulaire: Languages,
};

const exercisesDone = (p: ParcoursWithProgress) =>
  (p.exerciseStats?.qcmDone ?? 0) + (p.exerciseStats?.trousDone ?? 0);

// "En cours" = au moins une leçon ou un exercice fait. Un parcours seulement ouvert
// (status/started_at sans activité) reste "À découvrir" : pas de parcours à 0 % en cours.
const isDone = (p: ParcoursWithProgress) => p.progress?.percent === 100;
const isStarted = (p: ParcoursWithProgress) => (p.progress?.completed ?? 0) > 0 || exercisesDone(p) > 0;

const titleOf = (p: ParcoursWithProgress) => p.nom_parcours?.trim() || `${p.category} ${p.level}`;
// Titres de leçon SEO "Titre au TEF IRN | accroche" : on garde la partie courte (même règle que Ma progression).
const shortLessonTitle = (title: string) => title.split(" | ")[0].replace(/\s+au TEF IRN$/i, "");
const hrefOf = (p: ParcoursWithProgress) => `/tef-irn/parcours/${p.slug}`;

function ProgressBar({ percent, label, className = "h-2" }: { percent: number; label: string; className?: string }) {
  return (
    <div
      className={`w-full rounded-full bg-indigo-100 ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`rounded-full bg-indigo-600 ${className}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-black uppercase tracking-tight text-slate-900">
      {title}
      <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-xs font-bold text-zinc-600">{count}</span>
    </h2>
  );
}

function CategoryIcon({ p, done }: { p: ParcoursWithProgress; done?: boolean }) {
  const Icon = done ? CheckCircle2 : CATEGORY_ICONS[p.category?.toLowerCase()] ?? BookOpen;
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${done ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

function StatsLine({ p }: { p: ParcoursWithProgress }) {
  const prog = p.progress;
  const ex = p.exerciseStats;
  if (!prog) return null;
  return (
    <p className="text-xs text-zinc-500">
      <span className="font-bold text-zinc-900">{prog.completed}/{prog.total}</span> leçons
      {ex && (
        <>
          {" · "}QCM <span className="font-bold text-zinc-900">{ex.qcmDone}/{ex.qcmTotal}</span>
          {" · "}Chasse aux erreurs <span className="font-bold text-zinc-900">{ex.trousDone}/{ex.trousTotal}</span>
        </>
      )}
    </p>
  );
}

function ParcoursRow({
  p,
  action,
  showStats,
  recommended,
  done,
}: {
  p: ParcoursWithProgress;
  action: string;
  showStats?: boolean;
  recommended?: boolean;
  done?: boolean;
}) {
  const count = p.lessonCount ?? 0;
  const primary = action === "Continuer" || recommended;

  return (
    <li>
      <Link href={hrefOf(p)} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-indigo-50/40">
        <CategoryIcon p={p} done={done} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[15px] font-bold text-zinc-900 first-letter:uppercase group-hover:text-indigo-600">{titleOf(p)}</p>
          <p className="text-xs font-medium text-zinc-500">
            <span className="capitalize">{p.category}</span> · {p.level}
            {!showStats && count > 0 && ` · ${count} leçons`}
          </p>
          {showStats && <StatsLine p={p} />}
          {showStats && p.progress && (
            <div className="max-w-xs pt-1">
              <ProgressBar percent={p.progress.percent} label={`Progression du parcours ${titleOf(p)}`} className="h-1.5" />
            </div>
          )}
        </div>
        {recommended && (
          <span className="shrink-0 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white">Conseillé</span>
        )}
        <span
          className={`hidden shrink-0 items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition-colors sm:inline-flex ${
            primary
              ? "border border-indigo-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
              : "border border-zinc-200 text-zinc-600 group-hover:border-indigo-200 group-hover:text-indigo-600"
          }`}
        >
          {action}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 sm:hidden" aria-hidden />
      </Link>
    </li>
  );
}

function ResumeCard({ p }: { p: ParcoursWithProgress }) {
  const prog = p.progress;
  // timeZone fixé : rendu identique serveur/client (pas d'erreur d'hydratation).
  const startedLabel = prog?.started_at
    ? new Date(prog.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })
    : null;

  return (
    <section
      aria-labelledby="reprendre-title"
      className="mb-12 rounded-3xl border-2 border-indigo-600 bg-indigo-50/60 p-6 shadow-lg shadow-indigo-100 lg:p-8"
    >
      <p id="reprendre-title" className="mb-3 text-xs font-black uppercase tracking-widest text-indigo-600">
        Reprendre
      </p>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-indigo-200 bg-white text-[10px] font-black uppercase tracking-widest">
              {p.level}
            </Badge>
            <Badge variant="outline" className="border-indigo-200 bg-white text-[10px] font-black uppercase tracking-widest">
              {p.category}
            </Badge>
            {startedLabel && <span className="text-xs text-zinc-500">commencé le {startedLabel}</span>}
          </div>
          <h3 className="text-2xl font-black tracking-tight text-zinc-900 first-letter:uppercase">{titleOf(p)}</h3>
          {p.nextLesson && (
            <p className="text-sm text-zinc-600">
              Prochaine leçon : <span className="font-bold text-zinc-900">{shortLessonTitle(p.nextLesson.title)}</span>
            </p>
          )}
          {prog && (
            <div className="max-w-md space-y-2 pt-1">
              <ProgressBar percent={prog.percent} label={`Progression du parcours ${titleOf(p)}`} className="h-2.5" />
              <StatsLine p={p} />
            </div>
          )}
        </div>
        <Link
          href={hrefOf(p)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
        >
          Continuer <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

const listClass = "divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm";

export default function ParcoursList({
  allParcours,
  user,
  activeParcoursId = null
}: {
  allParcours: ParcoursWithProgress[];
  user: User | null;
  activeParcoursId?: string | null;
}) {
  // "Reprendre" = le parcours actif de la TopBar (profiles.last_active_parcours_id),
  // même sans activité. À défaut, le parcours en cours démarré le plus récemment.
  const active = allParcours.find(p => p.id === activeParcoursId && !isDone(p));
  const enCours = allParcours
    .filter(p => !isDone(p) && isStarted(p))
    .sort((a, b) => (b.progress?.started_at ?? "").localeCompare(a.progress?.started_at ?? ""));
  const current = active ?? enCours[0];
  const otherEnCours = enCours.filter(p => p.id !== current?.id);
  const termines = allParcours.filter(isDone);
  const aDecouvrir = allParcours.filter(p => !isDone(p) && !isStarted(p) && p.id !== current?.id);

  const levels = [...new Set(allParcours.map(p => p.level))].sort();
  // Conseillé : premier parcours non commencé du niveau le plus bas pas encore terminé
  // (on consolide les bases avant de monter de niveau). Ordre des catégories = ordre de getParcours.
  const lowestOpenLevel = levels.find(l => aDecouvrir.some(p => p.level === l));
  const recommended = user ? aDecouvrir.find(p => p.level === lowestOpenLevel) : undefined;
  // Onglet par défaut : celui du parcours conseillé, sinon celui du parcours en cours.
  const [activeLevel, setActiveLevel] = useState(recommended?.level ?? current?.level ?? levels[0]);

  const ofActiveLevel = allParcours.filter(p => p.level === activeLevel);
  const doneInLevel = ofActiveLevel.filter(isDone).length;
  const toDiscover = aDecouvrir.filter(p => p.level === activeLevel);

  return (
    <PageTransition>
      <article className="min-h-screen bg-zinc-50/50 p-6 pt-10 lg:p-12" aria-label="Liste des parcours TEF IRN">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
              {user ? "Mes Parcours" : "Parcours de formation"}
            </Badge>
            <h1 className="mb-4 text-5xl font-black uppercase tracking-tighter text-zinc-900">
              {user ? (
                <>Votre <span className="text-indigo-600">apprentissage</span> sur mesure</>
              ) : (
                <>Des parcours <span className="text-indigo-600">d&apos;apprentissage</span> optimisés</>
              )}
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500">
              Suivez votre progression étape par étape à travers nos modules spécialisés pour réussir le TEF IRN.
            </p>
            {user && (
              <Link
                href="/tef-irn/progression"
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 underline-offset-2 hover:underline"
              >
                Voir le détail dans Ma progression <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </header>

          {current && <ResumeCard p={current} />}

          {otherEnCours.length > 0 && (
            <section className="mb-12 space-y-4">
              <SectionTitle title="Autres parcours en cours" count={otherEnCours.length} />
              <ul className={listClass}>
                {otherEnCours.map(p => (
                  <ParcoursRow key={p.id} p={p} action="Continuer" showStats />
                ))}
              </ul>
            </section>
          )}

          {allParcours.length > 0 && (
            <section className="space-y-4">
              <SectionTitle title={user ? "À découvrir" : "Tous les parcours"} count={user ? aDecouvrir.length : allParcours.length} />

              <Tabs value={activeLevel} onValueChange={(value) => setActiveLevel(String(value))}>
                <TabsList className="w-full h-11!">
                  {levels.map(l => {
                    const ofLevel = allParcours.filter(p => p.level === l);
                    return (
                      <TabsTrigger key={l} value={l} className="font-black">
                        {l}
                        {user && (
                          <span className="text-xs font-medium text-zinc-400">
                            {ofLevel.filter(isDone).length}/{ofLevel.length}
                          </span>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {user && ofActiveLevel.length > 0 && (
                <div className="flex items-center gap-3">
                  <p className="shrink-0 text-xs text-zinc-500">
                    Niveau <span className="font-bold text-zinc-900">{activeLevel}</span> ·{" "}
                    <span className="font-bold text-zinc-900">{doneInLevel}/{ofActiveLevel.length}</span> parcours terminés
                  </p>
                  <div className="max-w-xs flex-1">
                    <ProgressBar
                      percent={Math.round((doneInLevel / ofActiveLevel.length) * 100)}
                      label={`Parcours terminés du niveau ${activeLevel}`}
                    />
                  </div>
                </div>
              )}

              {toDiscover.length > 0 ? (
                <ul className={listClass}>
                  {toDiscover.map(p => (
                    <ParcoursRow key={p.id} p={p} action="Commencer" recommended={p.id === recommended?.id} />
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
                  Tous les parcours du niveau {activeLevel} sont commencés ou terminés.
                </p>
              )}
            </section>
          )}

          {termines.length > 0 && (
            <details className="group/done mt-12">
              <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-zinc-400 transition-transform group-open/done:rotate-90" aria-hidden />
                <SectionTitle title="Terminés" count={termines.length} />
              </summary>
              <ul className={`mt-4 ${listClass}`}>
                {termines.map(p => (
                  <ParcoursRow key={p.id} p={p} action="Revoir" showStats done />
                ))}
              </ul>
            </details>
          )}

          {allParcours.length === 0 && (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-zinc-200">
              <Sparkles className="mx-auto text-zinc-200 mb-6" size={48} />
              <h2 className="text-lg font-black text-zinc-900 mb-2">Aucun parcours disponible</h2>
              <p className="text-zinc-400 font-bold">Les leçons arrivent bientôt !</p>
            </div>
          )}
        </div>
      </article>
    </PageTransition>
  );
}
